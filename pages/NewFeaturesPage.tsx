
import React, { useState, useMemo } from 'react';
import { Plus, Sparkles, Trash2, Edit3, ExternalLink, Copy, Check, ArrowUpDown, ChevronUp, ChevronDown, Layers, ChevronRight, FileSpreadsheet, Bell, Megaphone, Rocket, Navigation, BarChart3 } from 'lucide-react';
import { useNewFeatures } from '../hooks';
import { NewFeature, NewFeatureFilterState } from '../types';
import NewFeatureDetailPanel from '../components/NewFeatureDetailPanel';

const formatCardDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}-${dd}-${yy}`;
};

const platformColors: Record<string, string> = {
  'UCP': 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  'Curator': 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  'FOCUS': 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
};

interface NewFeaturesPageProps {
  filters: NewFeatureFilterState;
  setFilters: React.Dispatch<React.SetStateAction<NewFeatureFilterState>>;
}

const NewFeaturesPage: React.FC<NewFeaturesPageProps> = ({ filters, setFilters }) => {
  const { features, allFeatures, loading, upsert, remove } = useNewFeatures(filters);
  
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedFeatureId, setCopiedFeatureId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('launch_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [groupByQuarter, setGroupByQuarter] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [quarterYear, setQuarterYear] = useState('2026');

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

  const metrics = useMemo(() => {
    const total = allFeatures.length;
    const fullpathCount = allFeatures.filter(f => f.source === 'Fullpath').length;
    const reynoldsCount = allFeatures.filter(f => f.source === 'Reynolds').length;
    const ucpCount = allFeatures.filter(f => f.platform === 'UCP').length;
    const curatorCount = allFeatures.filter(f => f.platform === 'Curator').length;
    const focusCount = allFeatures.filter(f => f.platform === 'FOCUS').length;
    return { total, fullpathCount, reynoldsCount, ucpCount, curatorCount, focusCount };
  }, [allFeatures]);

  const quarterCounts = useMemo(() => {
    return ['Q1', 'Q2', 'Q3', 'Q4'].map(q => ({
      label: q,
      count: allFeatures.filter(f => f.quarterly_release === `${q} ${quarterYear}`).length
    }));
  }, [allFeatures, quarterYear]);

  const renderFeatureCard = (feature: NewFeature) => {
    const displayPMRs = feature.pmrs && feature.pmrs.length > 0
      ? feature.pmrs
      : (feature.pmr_number ? [{ id: 'legacy', number: feature.pmr_number, link: feature.pmr_link || '' }] : []);

    const isLaunched = feature.status === 'Launched';

    return (
      <div
        key={feature.id}
        onClick={() => handleRowClick(feature.id)}
        className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200 cursor-pointer overflow-hidden relative flex"
      >
        {/* Left edge status bar */}
        <div className={`w-1.5 flex-shrink-0 ${isLaunched ? 'bg-emerald-500' : feature.status === 'Pending' ? 'bg-purple-500' : 'bg-slate-400'}`} />

        {/* Card content */}
        <div className="p-4 flex-1 flex flex-col gap-2 min-w-0">

          {/* Row 1: Badge bar */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {feature.status && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  isLaunched
                    ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'text-purple-700 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-300'
                }`}>
                  {feature.status}
                </span>
              )}
              {feature.quarterly_release && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300 uppercase tracking-wider">
                  {feature.quarterly_release}
                </span>
              )}
              {feature.source && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  feature.source === 'Fullpath'
                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                }`}>
                  {feature.source}
                </span>
              )}
              {feature.type && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  feature.type === 'New'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : feature.type === 'Add'
                    ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                }`}>
                  {feature.type}
                </span>
              )}
              {feature.platform && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${platformColors[feature.platform] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                  {feature.platform}
                </span>
              )}
              {feature.product_area && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                  {feature.product_area}
                </span>
              )}
              {feature.location && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {feature.location}
                </span>
              )}
            </div>

            {/* Actions pinned top-right */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
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

          {/* Row 2: Title + PMR chips */}
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight truncate">
              {feature.title}
            </h3>
            {displayPMRs.length > 0 && (
              <div className="flex gap-1 flex-shrink-0">
                {displayPMRs.slice(0, 2).map((pmr, idx) => (
                  <span key={idx} className="text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">{pmr.number}</span>
                ))}
                {displayPMRs.length > 2 && <span className="text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">+{displayPMRs.length - 2}</span>}
              </div>
            )}
          </div>

          {/* Row 3: Summary */}
          {(feature.summary || feature.description) && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic line-clamp-1">
              {feature.summary || feature.description!.replace(/<[^>]*>/g, '')}
            </p>
          )}

          {/* Divider + Row 4: Details */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-slate-500 dark:text-slate-400 mt-1 pt-2 border-t border-slate-50 dark:border-slate-800/50">
            {feature.navigation && (
              <div className="flex items-center gap-1.5 min-w-0" title="Navigation">
                <Navigation size={10} className="text-slate-400 shrink-0" />
                <span className="font-bold text-slate-400 uppercase tracking-wider shrink-0">NAV:</span>
                <span className="font-medium break-words">{feature.navigation}</span>
              </div>
            )}
            {(feature.notified_date || feature.announced_date || feature.launch_date) && (
              <div className="flex items-center gap-x-4 gap-y-1 flex-wrap ml-auto">
                {feature.notified_date && (
                  <div className="flex items-center gap-1.5" title="Notified Date">
                    <Bell size={10} className="text-orange-500" />
                    <span className="font-bold text-orange-500 uppercase tracking-wider">Notified:</span>
                    <span className="text-orange-600 dark:text-orange-400">{formatCardDate(feature.notified_date)}</span>
                  </div>
                )}
                {feature.announced_date && (
                  <div className="flex items-center gap-1.5" title="Announced Date">
                    <Megaphone size={10} className="text-amber-500" />
                    <span className="font-bold text-amber-500 uppercase tracking-wider">Announced:</span>
                    <span className="text-amber-600 dark:text-amber-400">{formatCardDate(feature.announced_date)}</span>
                  </div>
                )}
                {feature.launch_date && (
                  <div className="flex items-center gap-1.5" title="Launch Date">
                    <Rocket size={10} className="text-emerald-500" />
                    <span className="font-bold text-emerald-500 uppercase tracking-wider">Launch:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{formatCardDate(feature.launch_date)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

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

      {/* Metrics Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Total Features */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-24 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Sparkles size={16} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Features</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{metrics.total}</div>
        </div>

        {/* Source Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-24 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
              <BarChart3 size={16} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">By Source</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-extrabold text-purple-600 dark:text-purple-400">{metrics.fullpathCount}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Fullpath</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">{metrics.reynoldsCount}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Reynolds</span>
            </div>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-24 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
              <Layers size={16} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">By Platform</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">{metrics.ucpCount}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">UCP</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-extrabold text-purple-600 dark:text-purple-400">{metrics.curatorCount}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Curator</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-extrabold text-orange-600 dark:text-orange-400">{metrics.focusCount}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">FOCUS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quarterly Breakdown */}
      <div className="mt-3">
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Quarterly Breakdown</h3>
          <div className="flex items-center gap-1">
            {['2024', '2025', '2026', '2027', '2028'].map(year => (
              <button
                key={year}
                onClick={() => setQuarterYear(year)}
                className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full transition-all ${
                  quarterYear === year
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {quarterCounts.map(q => (
            <div
              key={q.label}
              className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center text-center transition-colors"
            >
              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">{q.label}</span>
              <span className="text-lg font-bold text-slate-700 dark:text-slate-200">{q.count}</span>
            </div>
          ))}
        </div>
      </div>

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
