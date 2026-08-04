
import React, { useState, useMemo } from 'react';
import { Plus, Sparkles, Trash2, Edit3, ExternalLink, Copy, Check, ArrowUpDown, ChevronUp, ChevronDown, Layers, ChevronRight, FileSpreadsheet, Bell, Megaphone, Rocket, Navigation, BarChart3, Search, X } from 'lucide-react';
import { useNewFeatures } from '../hooks';
import { NewFeature, NewFeatureFilterState } from '../types';
import NewFeatureDetailPanel from '../components/NewFeatureDetailPanel';

const formatCardDate = (dateStr: string): string => {
  const datePart = dateStr.split('T')[0];
  const parts = datePart.split('-');
  if (parts.length !== 3) return dateStr;
  const [yyyy, mm, dd] = parts;
  if (!yyyy || !mm || !dd) return dateStr;
  return `${mm}-${dd}-${yyyy.slice(-2)}`;
};

const escapeCSV = (val: string) => {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
};

const downloadCSV = (headers: string[], rows: string[][], filenamePrefix: string) => {
  const csv = [headers.join(','), ...rows.map(r => r.map(escapeCSV).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

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
    ]);
    downloadCSV(headers, rows, 'new_features_export');
  };

  const handleExportAllDetailsCSV = () => {
    const headers = ['Title', 'Source', 'Type', 'Status', 'Quarterly Release', 'Platform', 'Product Area', 'Location', 'Navigation', 'Categories', 'Notified Date', 'Announced Date', 'Launch Date', 'PMR Numbers', 'PMR Links', 'Support Material Link', 'Summary', 'Description', 'Created At'];
    const rows = sortedFeatures.map(f => {
      const displayPMRs = f.pmrs && f.pmrs.length > 0
        ? f.pmrs
        : (f.pmr_number ? [{ id: 'legacy', number: f.pmr_number, link: f.pmr_link || '' }] : []);
      return [
        f.title || '',
        f.source || '',
        f.type || '',
        f.status || '',
        f.quarterly_release || '',
        f.platform || '',
        f.product_area || '',
        f.location || '',
        f.navigation || '',
        f.categories || '',
        f.notified_date || '',
        f.announced_date || '',
        f.launch_date || '',
        displayPMRs.map(p => p.number).join('; '),
        displayPMRs.filter(p => p.link).map(p => `${p.number}: ${p.link}`).join('; '),
        f.support_material_link || '',
        f.summary || '',
        f.description ? f.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '',
        f.created_at || ''
      ];
    });
    downloadCSV(headers, rows, 'new_features_all_details');
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
        className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer overflow-hidden relative flex"
      >
        {/* Left edge status bar */}
        <div className={`w-1.5 flex-shrink-0 ${isLaunched ? 'bg-emerald-500' : feature.status === 'Pending' ? 'bg-purple-500' : 'bg-slate-400'}`} />

        {/* Card content */}
        <div className="p-4 flex-1 flex flex-col gap-2 min-w-0">

          {/* Row 1: Badge bar */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {feature.status && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  isLaunched
                    ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'text-purple-700 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-300'
                }`}>
                  {feature.status}
                </span>
              )}
              {feature.quarterly_release && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded text-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 uppercase tracking-wider">
                  {feature.quarterly_release}
                </span>
              )}
              {feature.source && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  feature.source === 'Fullpath'
                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                }`}>
                  {feature.source}
                </span>
              )}
              {feature.type && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
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
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${platformColors[feature.platform] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                  {feature.platform}
                </span>
              )}
              {feature.product_area && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                  {feature.product_area}
                </span>
              )}
              {feature.location && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {feature.location}
                </span>
              )}
            </div>

            {/* Actions pinned top-right */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={(e) => handleCopyFeature(e, feature)}
                className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
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
                  className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
                  title="Open PMR Link"
                >
                  <ExternalLink size={14} />
                </a>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handleRowClick(feature.id); }}
                className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
              >
                <Edit3 size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete feature?')) remove(feature.id); }}
                className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Row 2: Title + PMR chips */}
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight truncate">
              {feature.title}
            </h3>
            {displayPMRs.length > 0 && (
              <div className="flex gap-1 flex-shrink-0">
                {displayPMRs.slice(0, 2).map((pmr, idx) => (
                  <span key={idx} className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">{pmr.number}</span>
                ))}
                {displayPMRs.length > 2 && <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">+{displayPMRs.length - 2}</span>}
              </div>
            )}
          </div>

          {/* Row 3: Summary */}
          {(feature.summary || feature.description) && (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic line-clamp-1">
              {feature.summary || feature.description!.replace(/<[^>]*>/g, '')}
            </p>
          )}

          {/* Divider + Row 4: Details */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400 mt-1 pt-2 border-t border-slate-200/60 dark:border-[#38383A]">
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

  const hasActiveFilters = !!(filters.search || filters.source || filters.type || filters.quarter || filters.year || filters.status || filters.platform);

  const handleResetFilters = () => {
    setFilters({ search: '', source: '', type: '', quarter: '', year: '', status: '', platform: '' });
  };

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex items-center gap-2 mb-4">
        <div className="relative">
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
                  onClick={() => { setIsExportMenuOpen(false); handleExportAllDetailsCSV(); }}
                  className="w-full px-3 py-2 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  All Details CSV
                </button>
              </div>
            </>
          )}
        </div>
        <button
          onClick={() => { setSelectedFeatureId(null); setIsCreating(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-xl font-semibold text-sm hover:bg-blue-600 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
        >
          <Plus size={16} /> Add Feature
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

      {/* Metrics Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Total Features */}
        <div className="rounded-2xl bg-white/80 dark:bg-[#2C2C2E] p-4 flex flex-col justify-between h-24 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <Sparkles size={16} />
            </div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Features</span>
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{metrics.total}</div>
        </div>

        {/* Source Breakdown */}
        <div className="rounded-2xl bg-white/80 dark:bg-[#2C2C2E] p-4 flex flex-col justify-between h-24 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
              <BarChart3 size={16} />
            </div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">By Source</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{metrics.fullpathCount}</span>
              <span className="text-xs font-bold text-slate-400 uppercase">Fullpath</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{metrics.reynoldsCount}</span>
              <span className="text-xs font-bold text-slate-400 uppercase">Reynolds</span>
            </div>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="rounded-2xl bg-white/80 dark:bg-[#2C2C2E] p-4 flex flex-col justify-between h-24 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
              <Layers size={16} />
            </div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">By Platform</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{metrics.ucpCount}</span>
              <span className="text-xs font-bold text-slate-400 uppercase">UCP</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{metrics.curatorCount}</span>
              <span className="text-xs font-bold text-slate-400 uppercase">Curator</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{metrics.focusCount}</span>
              <span className="text-xs font-bold text-slate-400 uppercase">FOCUS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quarterly Breakdown */}
      <div className="mt-3">
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-sm font-semibold text-slate-400">Quarterly Breakdown</h3>
          <div className="flex items-center gap-1">
            {['2024', '2025', '2026', '2027', '2028'].map(year => (
              <button
                key={year}
                onClick={() => setQuarterYear(year)}
                className={`px-2.5 py-0.5 text-xs font-bold rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none ${
                  quarterYear === year
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-200/50 dark:bg-[#2C2C2E] text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-600 dark:hover:text-slate-300'
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
              className="rounded-2xl bg-white/80 dark:bg-[#2C2C2E] p-2.5 flex flex-col justify-center items-center text-center transition-colors"
            >
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">{q.label}</span>
              <span className="text-lg font-bold text-slate-700 dark:text-slate-200">{q.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Inline Filters */}
      <div className="mt-3 p-3 bg-white/80 dark:bg-[#2C2C2E] rounded-2xl border border-slate-200/60 dark:border-[#38383A]">
        <div className="flex flex-wrap gap-2 mb-2">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              placeholder="Search features..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-100/50 dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-[#38383A] rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
            {filters.search && (
              <button onClick={() => setFilters({...filters, search: ''})} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[110px]">
            <select value={filters.source} onChange={(e) => setFilters({...filters, source: e.target.value})} className="w-full pl-2.5 pr-7 py-1.5 bg-slate-100/50 dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-[#38383A] rounded-xl text-sm text-slate-700 dark:text-slate-300 appearance-none focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer">
              <option value="">All Sources</option>
              <option value="Fullpath">Fullpath</option>
              <option value="Reynolds">Reynolds</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
          </div>

          <div className="relative min-w-[100px]">
            <select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})} className="w-full pl-2.5 pr-7 py-1.5 bg-slate-100/50 dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-[#38383A] rounded-xl text-sm text-slate-700 dark:text-slate-300 appearance-none focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer">
              <option value="">All Types</option>
              <option value="New">New</option>
              <option value="Updated">Updated</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
          </div>

          <div className="relative min-w-[110px]">
            <select value={filters.quarter} onChange={(e) => setFilters({...filters, quarter: e.target.value})} className="w-full pl-2.5 pr-7 py-1.5 bg-slate-100/50 dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-[#38383A] rounded-xl text-sm text-slate-700 dark:text-slate-300 appearance-none focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer">
              <option value="">All Quarters</option>
              <option value="Q1">Q1</option>
              <option value="Q2">Q2</option>
              <option value="Q3">Q3</option>
              <option value="Q4">Q4</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
          </div>

          <div className="relative min-w-[100px]">
            <select value={filters.year} onChange={(e) => setFilters({...filters, year: e.target.value})} className="w-full pl-2.5 pr-7 py-1.5 bg-slate-100/50 dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-[#38383A] rounded-xl text-sm text-slate-700 dark:text-slate-300 appearance-none focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer">
              <option value="">All Years</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
          </div>

          <div className="relative min-w-[110px]">
            <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="w-full pl-2.5 pr-7 py-1.5 bg-slate-100/50 dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-[#38383A] rounded-xl text-sm text-slate-700 dark:text-slate-300 appearance-none focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer">
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Launched">Launched</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
          </div>

          <div className="relative min-w-[120px]">
            <select value={filters.platform} onChange={(e) => setFilters({...filters, platform: e.target.value})} className="w-full pl-2.5 pr-7 py-1.5 bg-slate-100/50 dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-[#38383A] rounded-xl text-sm text-slate-700 dark:text-slate-300 appearance-none focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer">
              <option value="">All Platforms</option>
              <option value="UCP">UCP</option>
              <option value="Curator">Curator</option>
              <option value="FOCUS">FOCUS</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
          </div>
        </div>
      </div>

      {/* Sort & Group Controls */}
      <div className="flex items-center justify-between mt-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <ArrowUpDown size={12} />
            <span className="font-medium">Sort by</span>
          </div>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
            className="px-2 py-1 text-xs font-bold rounded-xl bg-slate-200/50 dark:bg-[#2C2C2E] border-none text-slate-700 dark:text-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
          >
            <option value="launch_date">Launch Date</option>
            <option value="notified_date">Notified Date</option>
            <option value="title">Title</option>
            <option value="platform">Platform</option>
            <option value="status">Status</option>
          </select>
          <button
            onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            className="p-1 rounded-xl bg-slate-200/50 dark:bg-[#2C2C2E] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
            title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
        <button
          onClick={() => setGroupByQuarter(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none ${
            groupByQuarter
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
              : 'bg-slate-200/50 text-slate-500 hover:text-blue-600 dark:bg-[#2C2C2E] dark:text-slate-400 dark:hover:text-blue-400'
          }`}
        >
          <Layers size={12} /> Group by Quarter
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl bg-white/80 dark:bg-[#2C2C2E] ios-shimmer"></div>)}
        </div>
      ) : sortedFeatures.length === 0 ? (
        <div className="rounded-2xl bg-white/80 dark:bg-[#2C2C2E] p-12 text-center transition-colors">
          <div className="flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600">
            <Sparkles size={48} />
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
                className="flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-slate-200/30 dark:bg-white/5 border-none hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors mb-2 focus-visible:ring-2 focus-visible:ring-blue-500/50 outline-none"
              >
                <ChevronRight size={14} className={`text-slate-400 transition-transform ${collapsedGroups.has(group.quarter) ? '' : 'rotate-90'}`} />
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">{group.quarter}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{group.features.length} feature{group.features.length !== 1 ? 's' : ''}</span>
              </button>
              {!collapsedGroups.has(group.quarter) && (
                <div className="rounded-2xl bg-white/80 dark:bg-[#2C2C2E] overflow-hidden divide-y divide-slate-200/60 dark:divide-[#38383A] ml-2">
                  {group.features.map(feature => renderFeatureCard(feature))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-white/80 dark:bg-[#2C2C2E] overflow-hidden divide-y divide-slate-200/60 dark:divide-[#38383A]">
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
          allFeatures={allFeatures}
        />
      )}
    </div>
  );
};

export default NewFeaturesPage;
