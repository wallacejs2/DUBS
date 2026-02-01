
import React, { useState, useMemo } from 'react';
import { Plus, FileSpreadsheet } from 'lucide-react';
import { useDealerships, useEnterpriseGroups, useOrders, useProvidersProducts, useTeamMembers } from '../hooks';
import { DealershipWithRelations, DealershipStatus, ProductCode, DealershipFilterState } from '../types';
import { db } from '../db';
import DealershipCard from '../components/DealershipCard';
import DealershipForm from '../components/DealershipForm';
import DealershipDetailPanel from '../components/DealershipDetailPanel';
import EnterpriseGroupDetailPanel from '../components/EnterpriseGroupDetailPanel';
import ProviderProductDetailPanel from '../components/ProviderProductDetailPanel';
import TeamMemberDetailPanel from '../components/TeamMemberDetailPanel';

interface DealershipsPageProps {
  filters: DealershipFilterState;
}

type SubPanel = 
  | { type: 'group'; id: string }
  | { type: 'provider'; id: string }
  | { type: 'member'; id: string };

const DealershipsPage: React.FC<DealershipsPageProps> = ({ filters }) => {
  const { dealerships, loading, upsert, remove, getDetails, toggleFavorite } = useDealerships(filters);
  const { groups } = useEnterpriseGroups();
  const { orders } = useOrders();
  const { items: providerProducts, upsert: upsertPP, remove: removePP } = useProvidersProducts();
  const { members: teamMembers, upsert: upsertTM, remove: removeTM } = useTeamMembers();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
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

  const checkIsManaged = (dealerId: string) => {
    return orders.some(o => 
      o.dealership_id === dealerId && 
      o.products.some(p => p.product_code === ProductCode.P15392_MANAGED)
    );
  };

  const checkHasAddlWeb = (dealerId: string) => {
    return orders.some(o => 
      o.dealership_id === dealerId && 
      o.products.some(p => p.product_code === ProductCode.P15435_ADDL_WEB)
    );
  };

  const checkHasZeroPrice = (dealerId: string) => {
    return orders.some(o => 
      o.dealership_id === dealerId && 
      o.products.some(p => !p.amount)
    );
  };

  const handleExportCSV = () => {
    const allDealerships = db.getDealerships();
    const allGroups = db.getEnterpriseGroups();
    const flatData: any[] = [];
    const productCodes = Object.values(ProductCode);

    allDealerships.forEach(d => {
      const fullD = db.getDealershipWithRelations(d.id);
      if (!fullD) return;
      const groupName = allGroups.find(g => g.id === fullD.enterprise_group_id)?.name || 'Independent';
      
      const baseInfo: any = {
         Status: fullD.status,
         Hold_Reason: fullD.hold_reason || '',
         CIF: fullD.cif_number || '',
         Name: fullD.name,
         Group: groupName,
         Store: fullD.store_number || '',
         Branch: fullD.branch_number || '',
         PP_ID: fullD.pp_sys_id || '',
         ERA_ID: fullD.era_system_id || '',
         BU_ID: fullD.bu_id || '',
         Address: fullD.address_line1 || '',
         State: fullD.state || '',
         CRM: fullD.crm_provider,
         Sales_Contact: fullD.contacts?.sales_contact_name || '',
         Enrollment_Contact: fullD.contacts?.enrollment_contact_name || '',
         CSM: fullD.contacts?.assigned_specialist_name || '',
         POC_Name: fullD.contacts?.poc_name || '',
         POC_Email: fullD.contacts?.poc_email || '',
         POC_Phone: fullD.contacts?.poc_phone || '',
         Onboarding_Date: fullD.onboarding_date || '',
         Go_Live_Date: fullD.go_live_date || '',
         Term_Date: fullD.term_date || '',
      };

      const links = fullD.website_links || [];
      for (let i = 0; i < 4; i++) {
          const link = links[i];
          baseInfo[`clientID${i+1}`] = link ? link.client_id || '' : '';
          baseInfo[`websiteLink${i+1}`] = link ? link.primary_url || '' : '';
      }

      if (fullD.orders && fullD.orders.length > 0) {
          fullD.orders.forEach(o => {
              const row = {
                  ...baseInfo,
                  Received_Date: o.received_date,
                  Order_Number: o.order_number,
                  SortDate: o.received_date || '9999-99-99'
              };
              productCodes.forEach(code => row[code] = '');
              if (o.products && o.products.length > 0) {
                  o.products.forEach(p => {
                      if (productCodes.includes(p.product_code)) {
                          row[p.product_code] = p.amount;
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
              SortDate: '9999-99-99'
          };
          productCodes.forEach(code => row[code] = '');
          flatData.push(row);
      }
    });

    flatData.sort((a, b) => {
      const dateA = a.SortDate;
      const dateB = b.SortDate;
      if (dateA === dateB) return a.Name.localeCompare(b.Name);
      return dateA.localeCompare(dateB);
    });

    const columns = [
      'Status', 'Hold_Reason', 'CIF', 'Name', 'Group', 'Store', 'Branch', 
      'PP_ID', 'ERA_ID', 'BU_ID', 'Address', 'State', 'CRM', 
      'Sales_Contact', 'Enrollment_Contact', 'CSM', 'POC_Name', 'POC_Email', 'POC_Phone', 
      'Received_Date', 'Order_Number', 'Onboarding_Date',
      'Go_Live_Date', 'Term_Date',
      ...productCodes,
      'clientID1', 'websiteLink1', 'clientID2', 'websiteLink2',
      'clientID3', 'websiteLink3', 'clientID4', 'websiteLink4'
    ];

    const csvContent = [
      columns.join(','),
      ...flatData.map(row => columns.map(col => {
          const val = row[col];
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
      link.setAttribute('download', `dealerships_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const pushToPanelStack = (panel: SubPanel) => setPanelStack(prev => [...prev, panel]);
  const popPanelStack = () => setPanelStack(prev => prev.slice(0, -1));

  const activeSubPanel = panelStack[panelStack.length - 1];

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Dealerships</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage and track your curator dealership network.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportCSV}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 font-bold text-[11px] hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all"
          >
            <FileSpreadsheet size={14} /> Export CSV
          </button>
          <button 
            onClick={() => { setEditingDealer(null); setIsFormOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all dark:shadow-none"
          >
            <Plus size={16} /> New Dealership
          </button>
        </div>
      </div>

      <div className="w-full min-w-0">
          {loading ? (
              <div className="flex flex-col gap-3">
              {[1,2,3,4,5].map(i => (
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl h-24 border border-slate-100 dark:border-slate-800 animate-pulse"></div>
              ))}
              </div>
          ) : dealerships.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-12 text-center border border-slate-100 dark:border-slate-800 border-dashed">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600">
                  <Plus size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">No dealerships found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">Try adjusting your filters or create a new dealership to get started.</p>
              </div>
          ) : (
              <div className="flex flex-col gap-3">
              {dealerships.map(dealer => {
                  const details = getDetails(dealer.id);
                  const hasClientId = details?.website_links?.some(l => l.client_id && l.client_id.trim().length > 0) ?? false;
                  const hasCSM = details?.contacts?.assigned_specialist_name && details.contacts.assigned_specialist_name.trim().length > 0;
                  return (
                  <DealershipCard 
                      key={dealer.id} 
                      dealership={dealer} 
                      groupName={groups.find(g => g.id === dealer.enterprise_group_id)?.name}
                      isManaged={checkIsManaged(dealer.id)}
                      hasClientId={hasClientId}
                      hasAddlWeb={checkHasAddlWeb(dealer.id)}
                      hasZeroPrice={checkHasZeroPrice(dealer.id)}
                      missingCSM={!hasCSM}
                      onClick={() => setSelectedDealerId(dealer.id)}
                      onToggleFavorite={() => toggleFavorite(dealer.id)}
                  />
                  );
              })}
              </div>
          )}
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
