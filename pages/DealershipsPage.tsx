
import React, { useState, useMemo } from 'react';
import { Plus, FileSpreadsheet } from 'lucide-react';
import { useDealerships, useEnterpriseGroups, useOrders } from '../hooks';
import { DealershipWithRelations, DealershipStatus, ProductCode } from '../types';
import { db } from '../db';
import DealershipCard from '../components/DealershipCard';
import DealershipForm from '../components/DealershipForm';
import DealershipDetailPanel from '../components/DealershipDetailPanel';
import FilterBar from '../components/FilterBar';

const DealershipsPage: React.FC = () => {
  const [filters, setFilters] = useState({ search: '', status: '', group: '' });
  
  // Data for List (Filtered)
  const { dealerships, loading, upsert, remove, getDetails } = useDealerships(filters);
  const { groups } = useEnterpriseGroups();
  const { orders } = useOrders();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
  const [editingDealer, setEditingDealer] = useState<DealershipWithRelations | null>(null);

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

  const handleExportCSV = () => {
    // Get all data regardless of filters
    const allDealerships = db.getDealerships();
    const allGroups = db.getEnterpriseGroups();
    
    // Flatten data for CSV
    const flatData: any[] = [];
    const productCodes = Object.values(ProductCode); // Get all product codes for columns

    allDealerships.forEach(d => {
      const fullD = db.getDealershipWithRelations(d.id);
      if (!fullD) return;
      
      const groupName = allGroups.find(g => g.id === fullD.enterprise_group_id)?.name || 'Independent';
      
      // Base Dealership Info
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
         Go_Live_Date: fullD.go_live_date || '',
         Term_Date: fullD.term_date || '',
      };

      // Add Website Links (Max 4 as requested columns imply multiple sets)
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

              // Initialize all product columns to empty
              productCodes.forEach(code => row[code] = '');

              // Fill product amounts if they exist in this order
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
          // Dealership without orders - create one row so dealership info is exported
          const row = {
              ...baseInfo,
              Received_Date: '',
              Order_Number: '',
              SortDate: '9999-99-99' // Put at the end
          };
          // Initialize product columns
          productCodes.forEach(code => row[code] = '');
          
          flatData.push(row);
      }
    });

    // Sort by Received Date (Oldest to Newest)
    flatData.sort((a, b) => {
      const dateA = a.SortDate;
      const dateB = b.SortDate;
      if (dateA === dateB) {
          return a.Name.localeCompare(b.Name);
      }
      return dateA.localeCompare(dateB);
    });

    // Define Header Order explicitly based on requirements
    const columns = [
      'Status', 
      'Hold_Reason', 
      'CIF', 
      'Name', 
      'Group', 
      'Store', 
      'Branch', 
      'PP_ID', 
      'ERA_ID', 
      'BU_ID', 
      'Address', 
      'State', 
      'CRM', 
      'Sales_Contact', 
      'Enrollment_Contact', 
      'CSM', 
      'POC_Name', 
      'POC_Email', 
      'POC_Phone', 
      'Received_Date', 
      'Order_Number', 
      'Go_Live_Date', 
      'Term_Date',
      ...productCodes,
      'clientID1', 'websiteLink1',
      'clientID2', 'websiteLink2',
      'clientID3', 'websiteLink3',
      'clientID4', 'websiteLink4'
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

    // Download
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

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Dealerships</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage and track your curator dealership network.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportCSV}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 font-bold text-[11px] hover:bg-slate-50 shadow-sm transition-all"
          >
            <FileSpreadsheet size={14} /> Export CSV
          </button>
          <button 
            onClick={() => { setEditingDealer(null); setIsFormOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all"
          >
            <Plus size={16} /> New Dealership
          </button>
        </div>
      </div>

      <FilterBar 
        searchValue={filters.search}
        onSearchChange={(v) => setFilters({ ...filters, search: v })}
        filters={[
          { 
            label: 'Status', 
            value: filters.status, 
            onChange: (v) => setFilters({ ...filters, status: v }),
            options: Object.values(DealershipStatus).map(s => ({ label: s, value: s }))
          },
          {
            label: 'Group',
            value: filters.group,
            onChange: (v) => setFilters({ ...filters, group: v }),
            options: groups.map(g => ({ label: g.name, value: g.id }))
          }
        ]}
        onClear={() => setFilters({ search: '', status: '', group: '' })}
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="bg-white rounded-2xl h-24 border border-slate-100 animate-pulse"></div>
          ))}
        </div>
      ) : dealerships.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 border-dashed">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <Plus size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No dealerships found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Try adjusting your filters or create a new dealership to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {dealerships.map(dealer => (
            <DealershipCard 
              key={dealer.id} 
              dealership={dealer} 
              groupName={groups.find(g => g.id === dealer.enterprise_group_id)?.name}
              isManaged={checkIsManaged(dealer.id)}
              onClick={() => setSelectedDealerId(dealer.id)}
            />
          ))}
        </div>
      )}

      {isFormOpen && (
        <DealershipForm 
          groups={groups}
          initialData={editingDealer || undefined}
          onSubmit={handleCreate}
          onCancel={() => { setIsFormOpen(false); setEditingDealer(null); }}
        />
      )}

      {selectedDealerId && selectedDealerDetails && (
        <DealershipDetailPanel 
          dealership={selectedDealerDetails}
          groups={groups}
          onClose={() => setSelectedDealerId(null)}
          onUpdate={(data) => upsert(data)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default DealershipsPage;
