
import React, { useState, useMemo } from 'react';
import { Plus, Sparkles, Search, Trash2, Edit3, ExternalLink, Copy, Check } from 'lucide-react';
import { useNewFeatures } from '../hooks';
import { NewFeature } from '../types';
import FilterBar from '../components/FilterBar';
import NewFeatureDetailPanel from '../components/NewFeatureDetailPanel';

const NewFeaturesPage: React.FC = () => {
  const [filters, setFilters] = useState({ search: '' });
  const { features, loading, upsert, remove } = useNewFeatures(filters);
  
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedFeatureId, setCopiedFeatureId] = useState<string | null>(null);

  const activeFeature = useMemo(() => {
    if (isCreating) {
      return {
        title: '',
        description: '',
        created_at: new Date().toISOString()
      } as Partial<NewFeature>;
    }
    if (selectedFeatureId) {
      return features.find(f => f.id === selectedFeatureId);
    }
    return null;
  }, [isCreating, selectedFeatureId, features]);

  const handleRowClick = (id: string) => {
    setSelectedFeatureId(id);
    setIsCreating(false);
  };

  const handleCopyFeature = (e: React.MouseEvent, feature: NewFeature) => {
    e.stopPropagation();
    
    const lines = [
      feature.title.toUpperCase(),
      "----------------------------------------"
    ];

    if (feature.platform) lines.push(`Platform: ${feature.platform}`);
    if (feature.location) lines.push(`Location: ${feature.location}`);
    if (feature.launch_date) lines.push(`Launch Date: ${feature.launch_date}`);
    
    if (feature.pmr_number || feature.pmr_link) {
        lines.push('');
        if (feature.pmr_number) lines.push(`PMR #: ${feature.pmr_number}`);
        if (feature.pmr_link) lines.push(`PMR Link: ${feature.pmr_link}`);
    }

    if (feature.support_material_link) {
       lines.push(`Support Docs: ${feature.support_material_link}`);
    }

    if (feature.description) {
        lines.push('');
        lines.push('Description:');
        lines.push(feature.description);
    }

    const text = lines.join('\n');
    navigator.clipboard.writeText(text).then(() => {
        setCopiedFeatureId(feature.id);
        setTimeout(() => setCopiedFeatureId(null), 2000);
    });
  };

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">New Features</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track upcoming platform features, PMRs, and release schedules.</p>
        </div>
        <button 
          onClick={() => { setSelectedFeatureId(null); setIsCreating(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all"
        >
          <Plus size={16} /> Add Feature
        </button>
      </div>

      <FilterBar 
        searchValue={filters.search}
        onSearchChange={(v) => setFilters({...filters, search: v})}
        searchPlaceholder="Search features, PMRs, descriptions..."
      />

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-white rounded-xl border border-slate-100 animate-pulse"></div>)}
        </div>
      ) : features.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 border-dashed">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
            <Sparkles size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No Features Tracked</h3>
          <p className="text-xs text-slate-500 mt-1">Start by adding a new feature request or roadmap item.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
           {features.map(feature => (
              <div 
                key={feature.id}
                onClick={() => handleRowClick(feature.id)}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                 <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                       <Sparkles size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                       <h3 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight mb-1">{feature.title}</h3>
                       <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                          {feature.pmr_number && (
                            <span className="font-mono bg-slate-100 px-1.5 rounded text-slate-600">{feature.pmr_number}</span>
                          )}
                          {feature.platform && (
                            <span>{feature.platform}</span>
                          )}
                          {feature.location && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span>{feature.location}</span>
                            </>
                          )}
                          {feature.launch_date && (
                             <>
                               <span className="text-slate-300">•</span>
                               <span className={new Date(feature.launch_date) < new Date() ? "text-emerald-600 font-medium" : "text-slate-500"}>
                                 {feature.launch_date}
                               </span>
                             </>
                          )}
                       </div>
                       {feature.description && (
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{feature.description}</p>
                       )}
                    </div>
                 </div>

                 <div className="flex items-center gap-1 self-end sm:self-center">
                    <button 
                      onClick={(e) => handleCopyFeature(e, feature)}
                      className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="Copy details to clipboard"
                    >
                      {copiedFeatureId === feature.id ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>

                    {feature.pmr_link && (
                      <a 
                        href={feature.pmr_link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Open PMR Link"
                      >
                         <ExternalLink size={16} />
                      </a>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRowClick(feature.id); }}
                      className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete feature?')) remove(feature.id); }}
                      className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                 </div>
              </div>
           ))}
        </div>
      )}

      {activeFeature && (
        <NewFeatureDetailPanel 
          feature={activeFeature}
          onClose={() => { setSelectedFeatureId(null); setIsCreating(false); }}
          onUpdate={(data) => upsert(data)}
          onDelete={() => {
            if (activeFeature.id && window.confirm('Are you sure you want to delete this feature?')) {
              remove(activeFeature.id);
              setSelectedFeatureId(null);
            }
          }}
        />
      )}
    </div>
  );
};

export default NewFeaturesPage;
