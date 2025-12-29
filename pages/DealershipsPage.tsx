import React, { useState } from 'react';
import { Plus, FileSpreadsheet } from 'lucide-react';
import { useDealerships, useEnterpriseGroups } from '../hooks';
import { DealershipWithRelations, DealershipStatus } from '../types';
import DealershipCard from '../components/DealershipCard';
import DealershipForm from '../components/DealershipForm';
import DealershipDetailPanel from '../components/DealershipDetailPanel';
import FilterBar from '../components/FilterBar';

const DealershipsPage: React.FC = () => {
  const [filters, setFilters] = useState({ search: '', status: '', group: '' });
  const { dealerships, loading, upsert, remove, getDetails } = useDealerships(filters);
  const { groups } = useEnterpriseGroups();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
  const [editingDealer, setEditingDealer] = useState<DealershipWithRelations | null>(null);

  const selectedDealerDetails = selectedDealerId ? getDetails(selectedDealerId) : null;

  const handleCreate = (data: Partial<DealershipWithRelations>) => {
    upsert(data);
    setIsFormOpen(false);
    setEditingDealer(null);
  };

  const handleEdit = () => {
    // This is now handled inline in the panel, but we keep this for the "New" button if it were used for editing
    if (selectedDealerDetails) {
      setEditingDealer(selectedDealerDetails);
      setIsFormOpen(true);
      setSelectedDealerId(null);
    }
  };

  const handleDelete = () => {
    if (selectedDealerId && window.confirm('Are you sure you want to delete this dealership? This will also remove all related orders and data.')) {
      remove(selectedDealerId);
      setSelectedDealerId(null);
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
          <button className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 font-bold text-[11px] hover:bg-slate-50 shadow-sm transition-all">
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
          onUpdate={upsert}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default DealershipsPage;