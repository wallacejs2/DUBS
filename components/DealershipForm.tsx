import React, { useState } from 'react';
import { 
  Building2, Globe, Contact, HardDrive, Map, X, 
  Save, Trash2, Plus
} from 'lucide-react';
import { 
  DealershipWithRelations, DealershipStatus, CRMProvider, 
  EnterpriseGroup 
} from '../types';

interface DealershipFormProps {
  initialData?: Partial<DealershipWithRelations>;
  onSubmit: (data: Partial<DealershipWithRelations>) => void;
  onCancel: () => void;
  groups: EnterpriseGroup[];
}

const DealershipForm: React.FC<DealershipFormProps> = ({ initialData, onSubmit, onCancel, groups }) => {
  const [formData, setFormData] = useState<Partial<DealershipWithRelations>>(initialData || {
    status: DealershipStatus.DMT_PENDING,
    crm_provider: CRMProvider.OTHER,
    website_links: [{ id: '', dealership_id: '', primary_url: '' }],
    contacts: {
      id: '',
      dealership_id: '',
      sales_contact_name: '',
      enrollment_contact_name: '',
      assigned_specialist_name: '',
      poc_name: '',
      poc_phone: '',
      poc_email: ''
    }
  });

  const updateField = (field: keyof DealershipWithRelations, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateContact = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      contacts: { ...prev.contacts!, [field]: value }
    }));
  };

  const addWebsite = () => {
    const links = [...(formData.website_links || [])];
    links.push({ id: '', dealership_id: '', primary_url: '' });
    updateField('website_links', links);
  };

  const removeWebsite = (idx: number) => {
    const links = [...(formData.website_links || [])];
    links.splice(idx, 1);
    updateField('website_links', links);
  };

  const updateWebsite = (idx: number, val: string) => {
    const links = [...(formData.website_links || [])];
    links[idx].primary_url = val;
    updateField('website_links', links);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 mb-3 pb-1.5 border-b border-slate-100">
      <div className="p-1 bg-indigo-50 text-indigo-600 rounded-md">
        <Icon size={14} />
      </div>
      <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">{title}</h3>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
          <div>
            <h2 className="text-xl font-bold">{initialData?.id ? 'Edit Dealership' : 'New Dealership'}</h2>
            <p className="text-indigo-100 opacity-80 text-[11px]">Please provide all details below to {initialData?.id ? 'update' : 'register'} the dealership.</p>
          </div>
          <button onClick={onCancel} className="p-1.5 hover:bg-white/20 rounded-lg transition-all"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <form id="dealer-form" onSubmit={handleSubmit} className="space-y-8 pb-4">
            {/* Section 1: Basic Information */}
            <section className="animate-in fade-in duration-300">
              <SectionHeader icon={Building2} title="Basic Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dealership Name</label>
                  <input 
                    required
                    value={formData.name || ''} 
                    onChange={e => updateField('name', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Enterprise Group</label>
                  <select 
                    value={formData.enterprise_group_id || ''} 
                    onChange={e => updateField('enterprise_group_id', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-white"
                  >
                    <option value="">None / Independent</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label>
                  <select 
                    value={formData.status || DealershipStatus.DMT_PENDING} 
                    onChange={e => updateField('status', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-white font-semibold"
                  >
                    {Object.values(DealershipStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Contract Value ($)</label>
                  <input 
                    type="number"
                    value={formData.contract_value || 0} 
                    onChange={e => updateField('contract_value', parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-white"
                  />
                </div>
              </div>
            </section>

            {/* Section 2: Website & CRM */}
            <section className="animate-in fade-in duration-300">
              <SectionHeader icon={Globe} title="Website & CRM Integration" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">CRM Provider</label>
                  <select 
                    value={formData.crm_provider || CRMProvider.OTHER} 
                    onChange={e => updateField('crm_provider', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-white"
                  >
                    {Object.values(CRMProvider).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Website URLs</label>
                    <button type="button" onClick={addWebsite} className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 uppercase tracking-tighter">
                      <Plus size={10} /> Add Website
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {formData.website_links?.map((link, idx) => (
                      <div key={idx} className="flex gap-2 group">
                        <input 
                          value={link.primary_url} 
                          onChange={e => updateWebsite(idx, e.target.value)}
                          placeholder="https://example.com"
                          className="flex-1 px-3 py-1.5 text-[11px] rounded-lg border border-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-white"
                        />
                        {formData.website_links!.length > 1 && (
                          <button type="button" onClick={() => removeWebsite(idx)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: System Identifiers */}
            <section className="animate-in fade-in duration-300">
              <SectionHeader icon={HardDrive} title="System Identifiers" />
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {[
                  { label: 'CIF #', field: 'cif_number' },
                  { label: 'ERA ID', field: 'era_system_id' },
                  { label: 'PP Sys', field: 'pp_sys_id' },
                  { label: 'Store #', field: 'store_number' },
                  { label: 'Branch #', field: 'branch_number' },
                  { label: 'BU ID', field: 'bu_id' },
                ].map((item) => (
                  <div key={item.field} className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">{item.label}</label>
                    <input 
                      value={(formData as any)[item.field] || ''} 
                      onChange={e => updateField(item.field as any, e.target.value)}
                      className="w-full px-2 py-1.5 text-[10px] rounded-lg border border-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none bg-white font-mono"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Section 4: Contact Information */}
            <section className="animate-in fade-in duration-300">
              <SectionHeader icon={Contact} title="Primary Contacts" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">POC Name</label>
                  <input 
                    value={formData.contacts?.poc_name || ''} 
                    onChange={e => updateContact('poc_name', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">POC Email</label>
                  <input 
                    type="email"
                    value={formData.contacts?.poc_email || ''} 
                    onChange={e => updateContact('poc_email', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">POC Phone</label>
                  <input 
                    value={formData.contacts?.poc_phone || ''} 
                    onChange={e => updateContact('poc_phone', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assigned Specialist</label>
                  <input 
                    value={formData.contacts?.assigned_specialist_name || ''} 
                    onChange={e => updateContact('assigned_specialist_name', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Section 5: Address */}
            <section className="animate-in fade-in duration-300">
              <SectionHeader icon={Map} title="Physical Address" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Address Line 1</label>
                  <input 
                    required
                    value={formData.address_line1 || ''} 
                    onChange={e => updateField('address_line1', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">City</label>
                  <input 
                    required
                    value={formData.city || ''} 
                    onChange={e => updateField('city', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">State</label>
                  <input 
                    required
                    value={formData.state || ''} 
                    onChange={e => updateField('state', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Zip Code</label>
                  <input 
                    required
                    value={formData.zip_code || ''} 
                    onChange={e => updateField('zip_code', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                  />
                </div>
              </div>
            </section>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-white">
          <button 
            type="button" 
            onClick={onCancel}
            className="px-4 py-2 text-slate-400 font-semibold hover:text-slate-600 transition-colors text-xs"
          >
            Cancel
          </button>
          <div className="flex gap-3">
            <button 
              type="submit"
              form="dealer-form"
              className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all flex items-center gap-2 text-xs"
            >
              <Save size={14} /> {initialData?.id ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealershipForm;