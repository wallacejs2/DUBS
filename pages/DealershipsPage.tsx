
import React, { useState } from 'react';
import { Plus, FileSpreadsheet, Search, Hash, X, ChevronDown, ClipboardList } from 'lucide-react';
import { useDealerships, useEnterpriseGroups, useOrders, useProvidersProducts, useTeamMembers, useProductPricing } from '../hooks';
import { DealershipWithRelations, ProductCode, DealershipFilterState, DealershipStatus } from '../types';
import { db } from '../db';
import { hasOneTimeLine, hasUnpricedLine, summarizeOrders, summarizeProducts, activeOrderList, partitionOrders, allProductCodes, resolveLineAmount } from '../lib/orderPricing';
import { formatOemsForExport, hasNoOems, OEM_GROUPS, OEM_MAKES_ALPHABETICAL, encodeOemFilter } from '../lib/oem';
import DealershipCard from '../components/DealershipCard';
import DealershipForm from '../components/DealershipForm';
import DealershipDetailPanel from '../components/DealershipDetailPanel';
import EnterpriseGroupDetailPanel from '../components/EnterpriseGroupDetailPanel';
import ProviderProductDetailPanel from '../components/ProviderProductDetailPanel';
import TeamMemberDetailPanel from '../components/TeamMemberDetailPanel';

interface DealershipsPageProps {
  filters: DealershipFilterState;
  setFilters: React.Dispatch<React.SetStateAction<DealershipFilterState>>;
}

type SubPanel =
  | { type: 'group'; id: string }
  | { type: 'provider'; id: string }
  | { type: 'member'; id: string };

const DealershipsPage: React.FC<DealershipsPageProps> = ({ filters, setFilters }) => {
  const { dealerships, loading, upsert, remove, getDetails, toggleFavorite } = useDealerships(filters);
  const { groups } = useEnterpriseGroups();
  const { orders } = useOrders();
  const { pricing, productCodes: availableProductCodes } = useProductPricing();
  const { items: providerProducts, upsert: upsertPP, remove: removePP } = useProvidersProducts();
  const { members: teamMembers, upsert: upsertTM, remove: removeTM } = useTeamMembers();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
  const [editingDealer, setEditingDealer] = useState<DealershipWithRelations | null>(null);
  const [panelStack, setPanelStack] = useState<SubPanel[]>([]);

  const selectedDealerDetails = selectedDealerId ? getDetails(selectedDealerId) : null;

  const handleCreate = (data: Partial<DealershipWithRelations>) => {
    upsert(data);
    setIsFormOpen(false);
    setEditingDealer(null);
  };

  const handleDelete = () => {
    if (selectedDealerId && window.confirm('Are you sure you want to delete this dealership? This will also remove all related orders and data.')) {
      remove(selectedDealerId);
      setSelectedDealerId(null);
    }
  };

  // Card badges look at the ACTIVE DMT order only (most recent on or before
  // today); previous orders are ignored so products are not double counted.
  const activeOrdersFor = (dealerId: string) => activeOrderList(orders.filter(o => o.dealership_id === dealerId));

  const checkIsManaged = (dealerId: string) => {
    return activeOrdersFor(dealerId).some(o =>
      o.products.some(p => p.product_code === ProductCode.P15392_MANAGED)
    );
  };

  const checkHasAddlWeb = (dealerId: string) => {
    return activeOrdersFor(dealerId).some(o =>
      o.products.some(p => p.product_code === ProductCode.P15435_ADDL_WEB || p.product_code === ProductCode.P15436_MNGD_ADDL)
    );
  };

  const checkHasZeroPrice = (dealerId: string) => {
    return hasUnpricedLine(activeOrdersFor(dealerId));
  };

  const checkHasOneTime = (dealerId: string) => {
    return hasOneTimeLine(activeOrdersFor(dealerId));
  };

  /** Row key holding the YES/blank "is this product on the order" flag for a product code. */
  const productFlagKey = (code: string) => `_has_${code}`;

  const buildExportData = () => {
    const allDealerships = db.getDealerships();
    const allGroups = db.getEnterpriseGroups();
    const flatData: any[] = [];
    // Product columns: the editable product list plus any code still referenced by an order
    const productCodes = allProductCodes(availableProductCodes, db.getOrders());

    allDealerships.forEach(d => {
      const fullD = db.getDealershipWithRelations(d.id);
      if (!fullD) return;
      const groupName = allGroups.find(g => g.id === fullD.enterprise_group_id)?.name || 'Independent';
      // Only the ACTIVE order (most recent on or before today) drives
      // dealership-level flags and totals; previous orders are exported as
      // rows but marked "Previous" so they are not double counted.
      const { active: activeOrder } = partitionOrders(fullD.orders);
      const isManaged = !!activeOrder?.products?.some(p => p.product_code === ProductCode.P15392_MANAGED);
      const dealerSummary = summarizeOrders(activeOrder ? [activeOrder] : [], pricing);

      const baseInfo: any = {
         _dealerId: d.id,
         Status: fullD.status,
         Notes: [fullD.hold_reason, fullD.cancellation_reason].filter(Boolean).join(' | '),
         CIF: fullD.cif_number || '',
         Name: fullD.name,
         Group: groupName,
         Store: fullD.store_number || '',
         Branch: fullD.branch_number || '',
         PP_ID: fullD.pp_sys_id || '',
         ERA_ID: fullD.era_system_id || '',
         BU_ID: fullD.bu_id || '',
         MMS_ID: fullD.mms_id || '',
         Address: fullD.address_line1 || '',
         City: fullD.city || '',
         State: fullD.state || '',
         Zip_Code: fullD.zip_code ? `="${fullD.zip_code}"` : '',
         CRM: fullD.crm_provider,
         // All selected OEMs in one cell: "OEM Group - Make", comma separated, in saved order
         OEMs: formatOemsForExport(fullD.oems),
         Sales_Contact: fullD.contacts?.sales_contact_name || '',
         Enrollment_Contact: fullD.contacts?.enrollment_contact_name || '',
         CSM: fullD.contacts?.assigned_specialist_name || '',
         POC_Name: fullD.contacts?.poc_name || '',
         POC_Email: fullD.contacts?.poc_email || '',
         POC_Phone: fullD.contacts?.poc_phone || '',
         Onboarding_Date: fullD.onboarding_date || '',
         Go_Live_Date: fullD.go_live_date || '',
         Term_Date: fullD.term_date || '',
         Managed_Package: isManaged ? 'YES' : 'NO',
         // Dealership-level totals (used by the one-row-per-dealership exports)
         _dealerMonthly: dealerSummary.monthly,
         _dealerOneTime: dealerSummary.oneTime,
         _dealerEstimated: dealerSummary.hasEstimated,
      };

      const links = fullD.website_links || [];
      for (let i = 0; i < 4; i++) {
          const link = links[i];
          baseInfo[`clientID${i+1}`] = link ? link.client_id || '' : '';
          baseInfo[`websiteLink${i+1}`] = link ? link.primary_url || '' : '';
      }

      if (fullD.orders && fullD.orders.length > 0) {
          fullD.orders.forEach(o => {
              const orderSummary = summarizeProducts(o.products, pricing);
              const row = {
                  ...baseInfo,
                  Received_Date: o.received_date,
                  Order_Number: o.order_number,
                  Monthly_Total: orderSummary.monthly,
                  One_Time_Total: orderSummary.oneTime,
                  Estimated_Pricing: orderSummary.hasEstimated ? 'YES' : 'NO',
                  DMT_Order_Type: o === activeOrder ? 'Active' : 'Previous',
                  SortDate: o.received_date || '9999-99-99'
              };
              productCodes.forEach(code => {
                  row[code] = '';
                  // YES/blank flag per product (used by the MKT export, which omits pricing)
                  row[productFlagKey(code)] = '';
              });
              if (o.products && o.products.length > 0) {
                  o.products.forEach(p => {
                      if (productCodes.includes(p.product_code)) {
                          // No price on the order line: export the product's default (estimated)
                          // price as a plain number; blank only when there is no default either.
                          const line = resolveLineAmount(p, pricing);
                          row[p.product_code] = line.isUnpriced ? '' : line.amount;
                          row[productFlagKey(p.product_code)] = 'YES';
                      }
                  });
              }
              flatData.push(row);
          });
      } else {
          const row = {
              ...baseInfo,
              Received_Date: '',
              Order_Number: '',
              Monthly_Total: 0,
              One_Time_Total: 0,
              Estimated_Pricing: 'NO',
              DMT_Order_Type: '',
              SortDate: '9999-99-99'
          };
          productCodes.forEach(code => {
              row[code] = '';
              row[productFlagKey(code)] = '';
          });
          flatData.push(row);
      }
    });

    flatData.sort((a, b) => {
      const dateA = a.SortDate;
      const dateB = b.SortDate;
      if (dateA === dateB) return a.Name.localeCompare(b.Name);
      return dateA.localeCompare(dateB);
    });

    return { flatData, productCodes };
  };

  const downloadCsv = (headers: string[], keys: string[], flatData: any[], filenamePrefix: string) => {
    const csvContent = [
      headers.join(','),
      ...flatData.map(row => keys.map(key => {
          const val = row[key];
          const stringVal = String(val === undefined || val === null ? '' : val);
          if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
              return `"${stringVal.replace(/"/g, '""')}"`;
          }
          return stringVal;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const standardBaseColumns = (productCodes: string[]) => [
    'Status', 'Notes', 'CIF', 'Name', 'Group', 'Store', 'Branch',
    'PP_ID', 'ERA_ID', 'BU_ID', 'MMS_ID', 'Address', 'City', 'State', 'Zip_Code', 'CRM', 'OEMs',
    'Sales_Contact', 'Enrollment_Contact', 'CSM', 'POC_Name', 'POC_Email', 'POC_Phone',
    'Received_Date', 'Order_Number', 'Onboarding_Date',
    'Go_Live_Date', 'Term_Date', 'Managed_Package',
    ...productCodes,
    'Monthly_Total', 'One_Time_Total', 'Estimated_Pricing', 'DMT_Order_Type',
  ];

  const handleExportCSV = () => {
    const { flatData, productCodes } = buildExportData();

    const columns = [
      ...standardBaseColumns(productCodes),
      'clientID1', 'websiteLink1', 'clientID2', 'websiteLink2',
      'clientID3', 'websiteLink3', 'clientID4', 'websiteLink4'
    ];

    downloadCsv(columns, columns, flatData, 'dealerships_export');
  };

  const handleExportPerWebsite = () => {
    const { flatData } = buildExportData();

    // One row per dealership — this export excludes DMT order line items.
    // Prefer the ACTIVE order's row for each dealership.
    const seenDealers = new Set<string>();
    const dealerRows = [...flatData]
      .sort((a, b) => (a.DMT_Order_Type === 'Active' ? -1 : 0) - (b.DMT_Order_Type === 'Active' ? -1 : 0))
      .filter(row => {
        if (seenDealers.has(row._dealerId)) return false;
        seenDealers.add(row._dealerId);
        return true;
      });

    const expanded: any[] = [];
    dealerRows.forEach(row => {
      // One row per dealership: use dealership-level totals across all of its orders
      const dealerRow = {
        ...row,
        Monthly_Total: row._dealerMonthly,
        One_Time_Total: row._dealerOneTime,
        Estimated_Pricing: row._dealerEstimated ? 'YES' : 'NO',
        DMT_Order_Type: row.DMT_Order_Type ? 'Active' : '',
      };
      const pairs = [1, 2, 3, 4]
        .map(i => ({ clientID: row[`clientID${i}`] || '', websiteLink: row[`websiteLink${i}`] || '' }))
        .filter(p => p.clientID || p.websiteLink);
      if (pairs.length === 0) {
        expanded.push({ ...dealerRow, clientID: '', websiteLink: '' });
      } else {
        pairs.forEach(p => expanded.push({ ...dealerRow, clientID: p.clientID, websiteLink: p.websiteLink }));
      }
    });

    const columns = [
      ...standardBaseColumns([]).filter(c => c !== 'Received_Date' && c !== 'Order_Number'),
      'clientID', 'websiteLink'
    ];

    downloadCsv(columns, columns, expanded, 'dealerships_export_by_website');
  };

  const handleExportMKT = () => {
    const { flatData, productCodes } = buildExportData();

    const mktColumns: [string, string][] = [
      ['status', 'Status'],
      ['notes', 'Notes'],
      ['cif', 'CIF'],
      ['name', 'Name'],
      ['group', 'Group'],
      ['store', 'Store'],
      ['branch', 'Branch'],
      ['address', 'Address'],
      ['city', 'City'],
      ['state', 'State'],
      ['zip', 'Zip_Code'],
      ['crmProvider', 'CRM'],
      ['OEMs', 'OEMs'],
      ['salesPOC', 'Sales_Contact'],
      ['enrollmentPOC', 'Enrollment_Contact'],
      ['csmPOC', 'CSM'],
      ['pocName', 'POC_Name'],
      ['pocEmail', 'POC_Email'],
      ['pocPhone', 'POC_Phone'],
      ['dmtRecieved', 'Received_Date'],
      ['dmtOrder', 'Order_Number'],
      ['onabording', 'Onboarding_Date'],
      ['goLive', 'Go_Live_Date'],
      ['term', 'Term_Date'],
      // One column per product: YES when the package is on the row's DMT order, otherwise
      // blank. MKT does not receive pricing, so the dollar amounts are intentionally omitted.
      ...productCodes.map((code): [string, string] => [code, productFlagKey(code)]),
      ['clientID', 'clientID1'],
      ['websiteLink', 'websiteLink1'],
      ['clientID2', 'clientID2'],
      ['websiteLink2', 'websiteLink2'],
      ['clientID3', 'clientID3'],
      ['websiteLink3', 'websiteLink3'],
      ['clientID4', 'clientID4'],
      ['websiteLink4', 'websiteLink4'],
    ];

    downloadCsv(
      mktColumns.map(([header]) => header),
      mktColumns.map(([, key]) => key),
      flatData,
      'dealerships_mkt_export'
    );
  };

  const pushToPanelStack = (panel: SubPanel) => setPanelStack(prev => [...prev, panel]);
  const popPanelStack = () => setPanelStack(prev => prev.slice(0, -1));

  const activeSubPanel = panelStack[panelStack.length - 1];

  const hasActiveFilters = !!(filters.search || filters.cif || filters.client_id || filters.order_id || filters.status || filters.group || filters.issue || filters.oem || filters.managed || filters.addl_web || filters.sms || filters.one_time || filters.received_month || filters.onboarding_month || filters.go_live_month || filters.term_month);

  const handleResetFilters = () => {
    setFilters({ search: '', status: '', group: '', issue: '', oem: '', managed: '', addl_web: '', cif: '', client_id: '', order_id: '', sms: '', one_time: '', received_month: '', onboarding_month: '', go_live_month: '', term_month: '' });
  };

  return (
    <div className="animate-in fade-in duration-700 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <div className="hidden lg:block relative">
          <button
            onClick={() => setIsExportMenuOpen(prev => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-semibold hover:bg-blue-500/20 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
          >
            <FileSpreadsheet size={14} /> Export CSV <ChevronDown size={12} />
          </button>
          {isExportMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsExportMenuOpen(false)} />
              <div className="absolute left-0 top-full mt-1 z-50 w-44 bg-white dark:bg-[#2C2C2E] border border-slate-200/60 dark:border-[#38383A] rounded-xl shadow-lg overflow-hidden">
                <button
                  onClick={() => { setIsExportMenuOpen(false); handleExportCSV(); }}
                  className="w-full px-3 py-2 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Standard CSV
                </button>
                <button
                  onClick={() => { setIsExportMenuOpen(false); handleExportPerWebsite(); }}
                  className="w-full px-3 py-2 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Row per Website
                </button>
                <button
                  onClick={() => { setIsExportMenuOpen(false); handleExportMKT(); }}
                  className="w-full px-3 py-2 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  MKT
                </button>
              </div>
            </>
          )}
        </div>
        <button
          onClick={() => { setEditingDealer(null); setIsFormOpen(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
        >
          <Plus size={16} /> New Dealership
        </button>
        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-semibold transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Inline Filters */}
        <div className="mb-4 p-3 bg-white/80 dark:bg-[#2C2C2E] rounded-2xl border border-slate-200/60 dark:border-[#38383A]">
          {/* Dashboard lifecycle month filter indicator */}
          {(filters.received_month || filters.onboarding_month || filters.go_live_month || filters.term_month) && (
            <div className="mb-3 px-3 py-2 bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-700/50 rounded-xl flex items-center justify-between gap-2">
              <span className="text-xs text-cyan-700 dark:text-cyan-300 font-semibold">
                {filters.received_month && `Received: ${filters.received_month}`}
                {filters.onboarding_month && `Onboarding: ${filters.onboarding_month}`}
                {filters.go_live_month && `Go-Live: ${filters.go_live_month}`}
                {filters.term_month && `Termed: ${filters.term_month}`}
              </span>
              <button
                onClick={() => setFilters({ ...filters, received_month: '', onboarding_month: '', go_live_month: '', term_month: '' })}
                className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-200 flex-shrink-0"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Search row */}
          <div className="flex flex-wrap gap-2 mb-2">
            <div className="relative flex-1 min-w-[140px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                placeholder="Search name..."
                className="w-full pl-8 pr-7 py-1.5 bg-slate-100/50 dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-[#38383A] rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
              {filters.search && (
                <button onClick={() => setFilters({...filters, search: ''})} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="relative min-w-[120px]">
              <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                value={filters.cif}
                onChange={(e) => setFilters({...filters, cif: e.target.value})}
                placeholder="CIF #"
                className="w-full pl-8 pr-7 py-1.5 bg-slate-100/50 dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-[#38383A] rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
              {filters.cif && (
                <button onClick={() => setFilters({...filters, cif: ''})} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="relative min-w-[120px]">
              <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                value={filters.client_id}
                onChange={(e) => setFilters({...filters, client_id: e.target.value})}
                placeholder="40NM"
                className="w-full pl-8 pr-7 py-1.5 bg-slate-100/50 dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-[#38383A] rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
              {filters.client_id && (
                <button onClick={() => setFilters({...filters, client_id: ''})} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="relative min-w-[140px]">
              <ClipboardList className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                value={filters.order_id}
                onChange={(e) => setFilters({...filters, order_id: e.target.value})}
                placeholder="DMT Order ID"
                title="Search by DMT order number (matches active and previous orders)"
                className="w-full pl-8 pr-7 py-1.5 bg-slate-100/50 dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-[#38383A] rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
              {filters.order_id && (
                <button onClick={() => setFilters({...filters, order_id: ''})} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Dropdowns + toggles row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[130px]">
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full pl-2.5 pr-7 py-1.5 bg-slate-100/50 dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-[#38383A] rounded-xl text-sm text-slate-700 dark:text-slate-300 appearance-none focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                {Object.values(DealershipStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
            </div>

            <div className="relative min-w-[130px]">
              <select
                value={filters.group}
                onChange={(e) => setFilters({...filters, group: e.target.value})}
                className="w-full pl-2.5 pr-7 py-1.5 bg-slate-100/50 dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-[#38383A] rounded-xl text-sm text-slate-700 dark:text-slate-300 appearance-none focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
              >
                <option value="">All Groups</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
            </div>

            <div className="relative min-w-[140px]">
              <select
                value={filters.issue}
                onChange={(e) => setFilters({...filters, issue: e.target.value})}
                className="w-full pl-2.5 pr-7 py-1.5 bg-slate-100/50 dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-[#38383A] rounded-xl text-sm text-slate-700 dark:text-slate-300 appearance-none focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
              >
                <option value="">No Issues</option>
                <option value="no_id">Missing 40NM</option>
                <option value="zero_price">$0 Product Price</option>
                <option value="no_csm">Missing CSM</option>
                <option value="no_enrollment">Missing Enrollment</option>
                <option value="no_poc">Missing POC Email</option>
                <option value="no_web_provider">Missing Web Provider</option>
                <option value="no_inv_provider">Missing Inv. Provider</option>
                <option value="no_oem">Missing OEM</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
            </div>

            <div className="relative min-w-[140px]">
              <select
                value={filters.oem}
                onChange={(e) => setFilters({...filters, oem: e.target.value})}
                title="Filter by OEM Group (any Make in the group) or by an exact Make"
                className="w-full pl-2.5 pr-7 py-1.5 bg-slate-100/50 dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-[#38383A] rounded-xl text-sm text-slate-700 dark:text-slate-300 appearance-none focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
              >
                <option value="">All OEMs</option>
                <optgroup label="OEM Groups">
                  {OEM_GROUPS.map(g => <option key={encodeOemFilter('group', g)} value={encodeOemFilter('group', g)}>{g}</option>)}
                </optgroup>
                <optgroup label="Makes">
                  {OEM_MAKES_ALPHABETICAL.map(m => <option key={encodeOemFilter('make', m)} value={encodeOemFilter('make', m)}>{m}</option>)}
                </optgroup>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
            </div>

            <div className="flex items-center gap-3 ml-1">
              <label className="flex items-center gap-1.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.managed === 'yes'}
                  onChange={(e) => setFilters({...filters, managed: e.target.checked ? 'yes' : ''})}
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300">Managed</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.addl_web === 'yes'}
                  onChange={(e) => setFilters({...filters, addl_web: e.target.checked ? 'yes' : ''})}
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300">Addl. Web</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.sms === 'yes'}
                  onChange={(e) => setFilters({...filters, sms: e.target.checked ? 'yes' : ''})}
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300">SMS</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer group" title="Dealerships with at least one one-time fee line item">
                <input
                  type="checkbox"
                  checked={filters.one_time === 'yes'}
                  onChange={(e) => setFilters({...filters, one_time: e.target.checked ? 'yes' : ''})}
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300">One-Time</span>
              </label>
            </div>
          </div>
        </div>

      <div className="flex gap-6 items-start h-full">
        <div className="flex-1 w-full min-w-0">
            {loading ? (
                <div className="rounded-2xl overflow-hidden">
                {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-24 ios-shimmer"></div>
                ))}
                </div>
            ) : dealerships.length === 0 ? (
                <div className="py-16 text-center">
                <Plus size={48} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">No dealerships found</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Try adjusting your filters or create a new dealership to get started.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3 pb-20">
                {dealerships.map(dealer => {
                    const details = getDetails(dealer.id);
                    const hasClientId = details?.website_links?.some(l => l.client_id && l.client_id.trim().length > 0) ?? false;
                    const hasCSM = details?.contacts?.assigned_specialist_name && details.contacts.assigned_specialist_name.trim().length > 0;
                    const missingEnrollment = !details?.contacts?.enrollment_contact_name || details.contacts.enrollment_contact_name.trim().length === 0;
                    const missingPOC = !details?.contacts?.poc_email || details.contacts.poc_email.trim().length === 0;
                    const missingWebProvider = !dealer.website_provider || dealer.website_provider.trim().length === 0;
                    const missingInvProvider = !dealer.inventory_provider || dealer.inventory_provider.trim().length === 0;
                    const missingOem = hasNoOems(dealer.oems);
                    return (
                    <DealershipCard
                        key={dealer.id}
                        dealership={dealer}
                        groupName={groups.find(g => g.id === dealer.enterprise_group_id)?.name}
                        isManaged={checkIsManaged(dealer.id)}
                        hasClientId={hasClientId}
                        hasAddlWeb={checkHasAddlWeb(dealer.id)}
                        hasOneTime={checkHasOneTime(dealer.id)}
                        hasZeroPrice={checkHasZeroPrice(dealer.id)}
                        missingCSM={!hasCSM}
                        missingEnrollment={missingEnrollment}
                        missingPOC={missingPOC}
                        missingWebProvider={missingWebProvider}
                        missingInvProvider={missingInvProvider}
                        missingOem={missingOem}
                        onClick={() => setSelectedDealerId(dealer.id)}
                        onToggleFavorite={() => toggleFavorite(dealer.id)}
                    />
                    );
                })}
                </div>
            )}
        </div>
      </div>

      {isFormOpen && (
        <DealershipForm
          groups={groups}
          initialData={editingDealer || undefined}
          onSubmit={handleCreate}
          onCancel={() => { setIsFormOpen(false); setEditingDealer(null); }}
        />
      )}

      {selectedDealerId && selectedDealerDetails && !activeSubPanel && (
        <DealershipDetailPanel
          dealership={selectedDealerDetails}
          groups={groups}
          onClose={() => { setSelectedDealerId(null); setPanelStack([]); }}
          onUpdate={(data) => upsert(data)}
          onDelete={handleDelete}
          onToggleFavorite={() => toggleFavorite(selectedDealerId)}
          onViewEnterpriseGroup={(id) => pushToPanelStack({ type: 'group', id })}
          onViewProviderProduct={(id) => pushToPanelStack({ type: 'provider', id })}
          onViewTeamMember={(id) => pushToPanelStack({ type: 'member', id })}
        />
      )}

      {/* Drill-down Sub Panels */}
      {activeSubPanel && (
        <>
          {activeSubPanel.type === 'group' && groups.find(g => g.id === activeSubPanel.id) && (
            <EnterpriseGroupDetailPanel
              group={groups.find(g => g.id === activeSubPanel.id)!}
              dealerships={dealerships.filter(d => d.enterprise_group_id === activeSubPanel.id)}
              onClose={() => { setSelectedDealerId(null); setPanelStack([]); }}
              onBack={() => popPanelStack()}
              onUpdate={(data) => db.upsertEnterpriseGroup(data)}
              onDelete={() => { if(window.confirm('Delete group?')) { db.deleteEnterpriseGroup(activeSubPanel.id); popPanelStack(); } }}
              onViewDealer={(id) => { setSelectedDealerId(id); setPanelStack([]); }}
            />
          )}
          {activeSubPanel.type === 'provider' && providerProducts.find(p => p.id === activeSubPanel.id) && (
            <ProviderProductDetailPanel
              item={providerProducts.find(p => p.id === activeSubPanel.id)!}
              onClose={() => { setSelectedDealerId(null); setPanelStack([]); }}
              onBack={() => popPanelStack()}
              onUpdate={(data) => upsertPP(data)}
              onDelete={() => { if(window.confirm('Delete item?')) { removePP(activeSubPanel.id); popPanelStack(); } }}
            />
          )}
          {activeSubPanel.type === 'member' && teamMembers.find(m => m.id === activeSubPanel.id) && (
            <TeamMemberDetailPanel
              member={teamMembers.find(m => m.id === activeSubPanel.id)!}
              onClose={() => { setSelectedDealerId(null); setPanelStack([]); }}
              onBack={() => popPanelStack()}
              onUpdate={(data) => upsertTM(data)}
              onDelete={() => { if(window.confirm('Delete member?')) { removeTM(activeSubPanel.id); popPanelStack(); } }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default DealershipsPage;
