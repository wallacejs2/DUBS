
import React, { useState, useMemo } from 'react';
import { Plus, Sparkles, Search, Trash2, Edit3, ExternalLink, Copy, Check, ArrowUpDown, ChevronUp, ChevronDown, Layers, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { useNewFeatures } from '../hooks';
import { NewFeature } from '../types';
import FilterBar from '../components/FilterBar';
import NewFeatureDetailPanel from '../components/NewFeatureDetailPanel';

const platformColors: Record<string, string> = {
  'UCP': 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  'Curator': 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  'FOCUS': 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
};

const NewFeaturesPage: React.FC = () => {
  const [filters, setFilters] = useState({ search: '', quarter: '', year: '', type: '', status: '', platform: '', source: '' });
  const { features, loading, upsert, remove } = useNewFeatures(filters);
  
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedFeatureId, setCopiedFeatureId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('launch_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [groupByQuarter, setGroupByQuarter] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const activeFeature = useMemo(() => {
    if (isCreating) {
      return {
        title: '',
        description: '',
        type: 'New',
        status: 'Pending',
        created_at: new Date().toISOString(),
        pmrs: []
      } as Partial<NewFeature>;
    }
    if (selectedFeatureId) {
      return features.find(f => f.id === selectedFeatureId);
    }
    return null;
  }, [isCreating, selectedFeatureId, features]);

  const sortedFeatures = useMemo(() => {
    const sorted = [...features];
    sorted.sort((a, b) => {
      let valA: any, valB: any;
      switch (sortField) {
        case 'launch_date':
          valA = a.launch_date ? new Date(a.launch_date).getTime() : 0;
          valB = b.launch_date ? new Date(b.launch_date).getTime() : 0;
          break;
        case 'notified_date':
          valA = a.notified_date ? new Date(a.notified_date).getTime() : 0;
          valB = b.notified_date ? new Date(b.notified_date).getTime() : 0;
          break;
        case 'title':
          valA = a.title.toLowerCase();
          valB = b.title.toLowerCase();
          break;
        case 'platform':
          valA = (a.platform || '').toLowerCase();
          valB = (b.platform || '').toLowerCase();
          break;
        case 'status':
          valA = (a.status || '').toLowerCase();
          valB = (b.status || '').toLowerCase();
          break;
        default:
          return 0;
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [features, sortField, sortDir]);

  const groupedFeatures = useMemo(() => {
    if (!groupByQuarter) return null;
    const groups: Record<string, NewFeature[]> = {};
    sortedFeatures.forEach(f => {
      const key = f.quarterly_release || 'Unassigned';
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    });
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === 'Unassigned') return 1;
      if (b === 'Unassigned') return -1;
      const [qA, yA] = a.split(' ');
      const [qB, yB] = b.split(' ');
      const numA = parseInt(yA) * 10 + parseInt(qA.replace('Q', ''));
      const numB = parseInt(yB) * 10 + parseInt(qB.replace('Q', ''));
      return numB - numA;
    });
    return sortedKeys.map(key => ({ quarter: key, features: groups[key] }));
  }, [sortedFeatures, groupByQuarter]);

  const toggleGroup = (quarter: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(quarter)) next.delete(quarter);
      else next.add(quarter);
      return next;
    });
  };

  const handleRowClick = (id: string) => {
    setSelectedFeatureId(id);
    setIsCreating(false);
  };

  const handleCopyFeature = (e: React.MouseEvent, feature: NewFeature) => {
    e.stopPropagation();
    
    // Header: TYPE: TITLE
    const titleLine = feature.type 
        ? `${feature.type.toUpperCase()}: ${feature.title.toUpperCase()}`
        : feature.title.toUpperCase();

    const lines = [
      titleLine,
      "----------------------------------------"
    ];

    // Meta Line: Status | Release | Date
    const metaParts = [];
    if (feature.status) metaParts.push(feature.status);
    if (feature.quarterly_release) metaParts.push(feature.quarterly_release);
    if (feature.launch_date) metaParts.push(feature.launch_date);
    
    if (metaParts.length > 0) {
        lines.push(metaParts.join(' | '));
    }

    // Dates
    if (feature.notified_date) lines.push(`Notified Date: ${feature.notified_date}`);
    if (feature.announced_date) lines.push(`Announced Date: ${feature.announced_date}`);

    // Context Fields
    if (feature.source) lines.push(`Source: ${feature.source}`);
    if (feature.platform) lines.push(`Platform: ${feature.platform}`);
    if (feature.product_area) lines.push(`Product Area: ${feature.product_area}`);
    if (feature.location) lines.push(`Location: ${feature.location}`);
    if (feature.navigation) lines.push(`Navigation: ${feature.navigation}`);
    if (feature.categories) lines.push(`Categories: ${feature.categories}`);
    
    // PMRs
    const displayPMRs = feature.pmrs && feature.pmrs.length > 0 
        ? feature.pmrs 
        : (feature.pmr_number ? [{ id: 'legacy', number: feature.pmr_number, link: feature.pmr_link || '' }] : []);

    if (displayPMRs.length > 0) {
        const pmrStrings = displayPMRs.map(pmr => {
            if (pmr.link) return `${pmr.number} (${pmr.link})`;
            return pmr.number;
        });
        lines.push(`PMR #: ${pmrStrings.join(' | ')}`);
    }

    // Support Docs
    if (feature.support_material_link) {
       lines.push(`Support Docs: ${feature.support_material_link}`);
    }

    // Summary
    if (feature.summary) {
        lines.push(`Summary: ${feature.summary}`);
    }

    const text = lines.join('\n');
    navigator.clipboard.writeText(text).then(() => {
        setCopiedFeatureId(feature.id);
        setTimeout(() => setCopiedFeatureId(null), 2000);
    });
  };

  const handleExportCSV = () => {
    const escapeCSV = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };
    const headers = ['Title', 'Source', 'Type', 'Status', 'Quarterly Release', 'Platform', 'Product Area', 'Location', 'Notified Date', 'Announced Date', 'Launch Date', 'Categories', 'Navigation', 'PMR Numbers', 'Support Material Link', 'Summary'];
    const rows = sortedFeatures.map(f => [
      f.title || '',
      f.source || '',
      f.type || '',
      f.status || '',
      f.quarterly_release || '',
      f.platform || '',
      f.product_area || '',
      f.location || '',
      f.notified_date || '',
      f.announced_date || '',
      f.launch_date || '',
      f.categories || '',
      f.navigation || '',
      (f.pmrs || []).map(p => p.number).join('; '),
      f.support_material_link || '',
      f.summary || ''
    ].map(v => escapeCSV(v)).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `new_features_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const quarters = [
    { label: 'Q1', value: 'Q1' },
    { label: 'Q2', value: 'Q2' },
    { label: 'Q3', value: 'Q3' },
    { label: 'Q4', value: 'Q4' },
  ];

  const years = [
    { label: '2024', value: '2024' },
    { label: '2025', value: '2025' },
    { label: '2026', value: '2026' },
    { label: '2027', value: '2027' },
    { label: '2028', value: '2028' },
  ];

  const sources = [
    { label: 'Fullpath', value: 'Fullpath' },
    { label: 'Reynolds', value: 'Reynolds' },
  ];

  const types = [
    { label: 'New', value: 'New' },
    { label: 'Updated', value: 'Updated' },
  ];

  const statuses = [
    { label: 'Pending', value: 'Pending' },
    { label: 'Launched', value: 'Launched' },
  ];

  const platforms = [
    { label: 'UCP', value: 'UCP' },
    { label: 'Curator', value: 'Curator' },
    { label: 'FOCUS', value: 'FOCUS' },
  ];

  const renderFeatureCard = (feature: NewFeature) => {
    const displayPMRs = feature.pmrs && feature.pmrs.length > 0
      ? feature.pmrs
      : (feature.pmr_number ? [{ id: 'legacy', number: feature.pmr_number, link: feature.pmr_link || '' }] : []);

    const isLaunched = feature.status === 'Launched';
    const isPast = feature.launch_date ? new Date(feature.launch_date) < new Date() : false;

    return (
      <div
        key={feature.id}
        onClick={() => handleRowClick(feature.id)}
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all cursor-pointer group flex overflow-hidden"
      >
        {/* Timeline left edge */}
        <div className="flex flex-col items-center py-4 px-2 flex-shrink-0">
          <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
            isLaunched
              ? 'bg-emerald-500 border-emerald-300 dark:border-emerald-700'
              : 'bg-purple-500 border-purple-300 dark:border-purple-700'
          }`} />
          <div className={`w-0.5 flex-1 mt-1 rounded-full ${
            isLaunched
              ? 'bg-emerald-200 dark:bg-emerald-800'
              : 'bg-purple-200 dark:bg-purple-800'
          }`} />
        </div>

        {/* Card content */}
        <div className="flex-1 min-w-0 py-3 pr-3">
          {/* Row 1: Badge bar */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {feature.source && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide border ${
                feature.source === 'Fullpath'
                  ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
                  : 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
              }`}>
                {feature.source}
              </span>
            )}
            {feature.type && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide border ${
                feature.type === 'New'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
              }`}>
                {feature.type}
              </span>
            )}
            {feature.status && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide ${
                isLaunched
                  ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300'
                  : 'text-purple-700 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-300'
              }`}>
                {feature.status}
              </span>
            )}
            {feature.platform && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide border ${platformColors[feature.platform] || 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'}`}>
                {feature.platform}
              </span>
            )}
            {feature.quarterly_release && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 uppercase tracking-wide">
                {feature.quarterly_release}
              </span>
            )}
            {displayPMRs.length > 0 && (
              <div className="flex gap-1">
                {displayPMRs.slice(0, 2).map((pmr, idx) => (
                  <span key={idx} className="text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{pmr.number}</span>
                ))}
                {displayPMRs.length > 2 && <span className="text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">+{displayPMRs.length - 2}</span>}
              </div>
            )}

            {/* Actions pinned top-right */}
            <div className="ml-auto flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={(e) => handleCopyFeature(e, feature)}
                className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-lg transition-all"
                title="Copy details to clipboard"
              >
                {copiedFeatureId === feature.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
              {displayPMRs.length > 0 && displayPMRs[0].link && (
                <a
                  href={displayPMRs[0].link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-lg transition-all"
                  title="Open PMR Link"
                >
                  <ExternalLink size={14} />
                </a>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handleRowClick(feature.id); }}
                className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-lg transition-all"
              >
                <Edit3 size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete feature?')) remove(feature.id); }}
                className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Row 2: Title + launch date */}
          <div className="flex items-center justify-between gap-3 mb-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight truncate">
              {feature.title}
            </h3>
            {feature.launch_date && (
              <span className={`text-[10px] font-bold flex-shrink-0 ${isPast ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {feature.launch_date}
              </span>
            )}
          </div>

          {/* Row 3: Summary */}
          {(feature.summary || feature.description) && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1">
              {feature.summary || feature.description!.replace(/<[^>]*>/g, '')}
            </p>
          )}
          {feature.location && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 inline-block">{feature.location}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">New Features</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Track upcoming platform features, PMRs, and release schedules.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all"
          >
            <FileSpreadsheet size={14} /> Export CSV
          </button>
          <button
            onClick={() => { setSelectedFeatureId(null); setIsCreating(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all dark:shadow-none"
          >
            <Plus size={16} /> Add Feature
          </button>
        </div>
      </div>

      <FilterBar 
        searchValue={filters.search}
        onSearchChange={(v) => setFilters({...filters, search: v})}
        searchPlaceholder="Search features, PMRs, descriptions..."
        filters={[
          {
            label: 'Source',
            value: filters.source,
            onChange: (v) => setFilters({ ...filters, source: v }),
            options: sources
          },
          {
            label: 'Type',
            value: filters.type,
            onChange: (v) => setFilters({ ...filters, type: v }),
            options: types
          },
          {
            label: 'Quarter',
            value: filters.quarter,
            onChange: (v) => setFilters({ ...filters, quarter: v }),
            options: quarters
          },
          {
            label: 'Year',
            value: filters.year,
            onChange: (v) => setFilters({ ...filters, year: v }),
            options: years
          },
          {
            label: 'Status',
            value: filters.status,
            onChange: (v) => setFilters({ ...filters, status: v }),
            options: statuses
          },
          {
            label: 'Platform',
            value: filters.platform,
            onChange: (v) => setFilters({ ...filters, platform: v }),
            options: platforms
          }
        ]}
        onClear={() => setFilters({ search: '', quarter: '', year: '', type: '', status: '', platform: '', source: '' })}
      />

      {/* Sort & Group Controls */}
      <div className="flex items-center justify-between mt-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <ArrowUpDown size={12} />
            <span className="font-medium">Sort by</span>
          </div>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
            className="px-2 py-1 text-[11px] font-bold border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="launch_date">Launch Date</option>
            <option value="notified_date">Notified Date</option>
            <option value="title">Title</option>
            <option value="platform">Platform</option>
            <option value="status">Status</option>
          </select>
          <button
            onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            className="p-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
            title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
        <button
          onClick={() => setGroupByQuarter(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-lg border transition-all ${
            groupByQuarter
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800'
              : 'bg-white text-slate-500 border-slate-200 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:text-indigo-400'
          }`}
        >
          <Layers size={12} /> Group by Quarter
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 animate-pulse"></div>)}
        </div>
      ) : sortedFeatures.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-12 text-center border border-slate-100 dark:border-slate-800 border-dashed transition-colors">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
            <Sparkles size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">No Features Tracked</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Start by adding a new feature request or roadmap item.</p>
        </div>
      ) : groupByQuarter && groupedFeatures ? (
        <div className="space-y-4">
          {groupedFeatures.map(group => (
            <div key={group.quarter}>
              <button
                onClick={() => toggleGroup(group.quarter)}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all mb-2"
              >
                <ChevronRight size={14} className={`text-slate-400 transition-transform ${collapsedGroups.has(group.quarter) ? '' : 'rotate-90'}`} />
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800">{group.quarter}</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{group.features.length} feature{group.features.length !== 1 ? 's' : ''}</span>
              </button>
              {!collapsedGroups.has(group.quarter) && (
                <div className="grid grid-cols-1 gap-3 ml-2">
                  {group.features.map(feature => renderFeatureCard(feature))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {sortedFeatures.map(feature => renderFeatureCard(feature))}
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
