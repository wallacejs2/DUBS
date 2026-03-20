
import React, { useState, useMemo } from 'react';
import { Plus, User, Mail, Phone, Trash2, Edit3, Building2, ChevronDown, ChevronRight, Copy, Check, Hash, AlertTriangle, Users } from 'lucide-react';
import { useShoppers, useDealerships } from '../hooks';
import { Shopper, ShopperStatus, ShopperPriority, Dealership } from '../types';
import FilterBar from '../components/FilterBar';
import ShopperDetailPanel from '../components/ShopperDetailPanel';

const formatPhone = (val?: string) => {
  if (!val) return '';
  const cleaned = ('' + val).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) return match[1] + '-' + match[2] + '-' + match[3];
  return val;
};

interface ShopperCardProps {
  shopper: Shopper;
  dealershipsMap: Map<string, Dealership>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const statusColors: Record<ShopperStatus, string> = {
  [ShopperStatus.ACTIVE]: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  [ShopperStatus.TESTING]: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  [ShopperStatus.REVIEW]: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  [ShopperStatus.RESOLVED]: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

const statusBorderColors: Record<ShopperStatus, string> = {
  [ShopperStatus.ACTIVE]: 'border-l-indigo-500',
  [ShopperStatus.TESTING]: 'border-l-blue-500',
  [ShopperStatus.REVIEW]: 'border-l-amber-500',
  [ShopperStatus.RESOLVED]: 'border-l-emerald-500',
};

const ShopperCard: React.FC<ShopperCardProps> = ({ shopper, dealershipsMap, isExpanded, onToggleExpand, onEdit, onDelete }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const allProfiles = (shopper.dealerships || []).flatMap(d => d.profiles);
  const totalProfiles = allProfiles.length;
  const totalDealerships = (shopper.dealerships || []).length;
  const firstIssue = allProfiles.find(p => p.issue)?.issue;
  const issueCount = allProfiles.filter(p => p.issue).length;

  const copyToClipboard = (text: string, field: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const handleCopyAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const lines: string[] = [];
    (shopper.dealerships || []).forEach(sd => {
      const dealer = dealershipsMap.get(sd.dealership_id);
      if (dealer) {
        const combo = `${dealer.pp_sys_id || ''}_${dealer.store_number || ''}_${dealer.branch_number || ''}`;
        lines.push(`DEALERSHIP ${combo}`);
      } else {
        lines.push('DEALERSHIP (unassigned)');
      }
      sd.profiles.forEach((profile, idx) => {
        const parts: string[] = [];
        if (profile.name) parts.push(profile.name.toUpperCase());
        if (profile.email) parts.push(profile.email);
        if (profile.phone) parts.push(profile.phone);
        if (profile.dms_id) parts.push(`DMS ${profile.dms_id}`);
        if (profile.curator_id) {
          let cur = `CUR - ${profile.curator_id}`;
          if (profile.curator_link) cur += ` ${profile.curator_link}`;
          parts.push(cur);
        }
        if (profile.issue) parts.push(` [Issue: ${profile.issue}]`);
        lines.push(`[${idx + 1}] ${parts.join(' | ')}`);
        (profile.cdp_ids || []).forEach(cdpId => {
          const sysLabel = cdpId.system === 'ucp' ? 'UCP' : cdpId.system === 'cdp_admin' ? 'CDPAdmin' : 'CUR';
          let line = `  - [${sysLabel}] ${cdpId.value}`;
          if (cdpId.notes) line += ` [${cdpId.notes}]`;
          lines.push(line);
        });
      });
    });
    const text = lines.join('\n').trim();
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedField('all');
        setTimeout(() => setCopiedField(null), 2000);
      });
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 border-l-[3px] ${statusBorderColors[shopper.status]} shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all`}>
      {/* Summary Row */}
      <div className="p-4 cursor-pointer" onClick={onEdit}>
        <div className="flex items-center justify-between gap-4">
          {/* Left: Avatar + Name + Dealership chips */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0 shadow-sm">
              {shopper.first_name.charAt(0)}{shopper.last_name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 truncate">{shopper.first_name} {shopper.last_name}</h3>
                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest flex-shrink-0 ${statusColors[shopper.status]}`}>
                  {shopper.status}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                {/* Dealership chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {totalDealerships > 0 ? (
                    (shopper.dealerships || []).map((sd, i) => {
                      const dealer = dealershipsMap.get(sd.dealership_id);
                      return (
                        <span key={sd.id} className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                          <Building2 size={8} className="text-slate-400 dark:text-slate-500" />
                          {dealer?.name || 'Unassigned'}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 italic">No dealerships</span>
                  )}
                </div>
                {/* Counters */}
                <span className="text-[9px] text-slate-400 dark:text-slate-500 flex items-center gap-1 flex-shrink-0">
                  <Users size={9} /> {totalProfiles} profile{totalProfiles !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {issueCount > 0 && (
              <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800 px-1.5 py-0.5 rounded-md flex items-center gap-1 mr-1" title={firstIssue}>
                <AlertTriangle size={9} /> {issueCount}
              </span>
            )}
            {totalDealerships > 0 && (
              <button
                onClick={handleCopyAll}
                className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                title="Copy All"
              >
                {copiedField === 'all' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
            )}
            {totalDealerships > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
                className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                title={isExpanded ? "Collapse" : "Expand Preview"}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
              title="Edit"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded: Dealership + Profile Preview */}
      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-4 pb-4 pt-3 bg-slate-50/50 dark:bg-slate-800/20 rounded-b-xl">
          <div className="space-y-3">
            {(shopper.dealerships || []).map((sd, dIdx) => {
              const dealer = dealershipsMap.get(sd.dealership_id);
              const combo = dealer ? `${dealer.pp_sys_id || ''}_${dealer.store_number || ''}_${dealer.branch_number || ''}` : '';

              return (
                <div key={sd.id}>
                  {/* Dealership header */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <Building2 size={11} className="text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      {dealer?.name || 'Unassigned'}
                    </span>
                    {combo && (
                      <button
                        onClick={(e) => copyToClipboard(combo, `combo-${dIdx}`, e)}
                        className="text-[9px] font-mono text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-0.5 transition-colors"
                        title="Copy PP_Store_Branch"
                      >
                        {copiedField === `combo-${dIdx}` ? <Check size={9} className="text-emerald-500" /> : <Hash size={9} />}
                        {combo}
                      </button>
                    )}
                  </div>

                  {/* Profiles under this dealership */}
                  <div className="ml-5 space-y-1">
                    {sd.profiles.map((profile, pIdx) => (
                      <div key={profile.id} className="flex flex-col">
                        <div className="flex items-center gap-1 flex-wrap text-[10px]">
                          <span className="font-bold text-slate-600 dark:text-slate-300">[{pIdx + 1}]</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{profile.name || '(unnamed)'}</span>
                          {profile.email && (
                            <>
                              <span className="text-slate-300 dark:text-slate-600">|</span>
                              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                                <Mail size={8} /> {profile.email}
                              </span>
                            </>
                          )}
                          {profile.phone && (
                            <>
                              <span className="text-slate-300 dark:text-slate-600">|</span>
                              <span className="text-slate-500 dark:text-slate-400 font-mono flex items-center gap-0.5">
                                <Phone size={8} /> {formatPhone(profile.phone)}
                              </span>
                            </>
                          )}
                          {profile.dms_id && (
                            <>
                              <span className="text-slate-300 dark:text-slate-600">|</span>
                              <span className="text-slate-500 dark:text-slate-400 font-mono">DMS {profile.dms_id}</span>
                            </>
                          )}
                          {profile.curator_id && (
                            <>
                              <span className="text-slate-300 dark:text-slate-600">|</span>
                              <span className="text-slate-500 dark:text-slate-400 font-mono">CUR {profile.curator_id}</span>
                            </>
                          )}
                          {profile.issue && (
                            <span className="text-[9px] text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800 px-1 py-0 rounded font-medium ml-0.5">
                              {profile.issue}
                            </span>
                          )}
                        </div>
                        {/* CDP IDs preview */}
                        {(profile.cdp_ids || []).length > 0 && (
                          <div className="ml-4 flex flex-col gap-0">
                            {profile.cdp_ids.map(cdpId => {
                              const sysLabel = cdpId.system === 'ucp' ? 'UCP' : cdpId.system === 'cdp_admin' ? 'CDPAdmin' : 'CUR';
                              const sysBadge = cdpId.system === 'ucp'
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : cdpId.system === 'cdp_admin'
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-purple-600 dark:text-purple-400';
                              return (
                                <div key={cdpId.id} className="text-[9px] flex items-center gap-1 text-slate-400 dark:text-slate-500">
                                  <span className="text-slate-300 dark:text-slate-600">-</span>
                                  <span className={`font-bold ${sysBadge}`}>[{sysLabel}]</span>
                                  <span className="font-mono truncate">{cdpId.value}</span>
                                  {cdpId.notes && <span className="italic text-slate-400 dark:text-slate-500">[{cdpId.notes}]</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Divider between dealerships */}
                  {dIdx < (shopper.dealerships || []).length - 1 && (
                    <div className="border-b border-slate-200 dark:border-slate-700/50 mt-2 mb-1"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const QAPage: React.FC = () => {
  const [filters, setFilters] = useState({ search: '', status: '', priority: '' });
  const { shoppers, loading, upsert, remove } = useShoppers(filters);
  const { dealerships } = useDealerships();

  const [selectedShopperId, setSelectedShopperId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const dealershipsMap = useMemo(() => {
    const map = new Map<string, Dealership>();
    dealerships.forEach(d => map.set(d.id, d));
    return map;
  }, [dealerships]);

  const activeShopper = useMemo(() => {
    if (isCreating) {
      return {
        first_name: '',
        last_name: '',
        status: ShopperStatus.ACTIVE,
        priority: ShopperPriority.MEDIUM,
        dealerships: [],
      } as Partial<Shopper>;
    }
    if (selectedShopperId) {
      return shoppers.find(s => s.id === selectedShopperId);
    }
    return null;
  }, [isCreating, selectedShopperId, shoppers]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">QA Shoppers</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage testers and audit accounts for system verification.</p>
        </div>
        <button
          onClick={() => { setSelectedShopperId(null); setIsCreating(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all dark:shadow-none"
        >
          <Plus size={16} /> New Shopper
        </button>
      </div>

      <FilterBar
        searchValue={filters.search}
        onSearchChange={(v) => setFilters({...filters, search: v})}
        filters={[
          {
            label: 'Status',
            value: filters.status,
            onChange: (v) => setFilters({...filters, status: v}),
            options: Object.values(ShopperStatus).map(s => ({ label: s, value: s }))
          },
          {
            label: 'Priority',
            value: filters.priority,
            onChange: (v) => setFilters({...filters, priority: v}),
            options: Object.values(ShopperPriority).map(p => ({ label: p, value: p }))
          }
        ]}
      />

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 animate-pulse"></div>)}
        </div>
      ) : shoppers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-12 text-center border border-slate-100 dark:border-slate-800 border-dashed transition-colors">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
            <User size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">No Shoppers Registered</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Begin by adding your first quality assurance tester to the system.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shoppers.map(shopper => (
            <ShopperCard
              key={shopper.id}
              shopper={shopper}
              dealershipsMap={dealershipsMap}
              isExpanded={expandedIds.has(shopper.id)}
              onToggleExpand={() => toggleExpand(shopper.id)}
              onEdit={() => { setSelectedShopperId(shopper.id); setIsCreating(false); }}
              onDelete={() => { if (window.confirm('Delete shopper?')) remove(shopper.id); }}
            />
          ))}
        </div>
      )}

      {activeShopper && (
        <ShopperDetailPanel
          shopper={activeShopper}
          onClose={() => { setSelectedShopperId(null); setIsCreating(false); }}
          onUpdate={(data) => upsert(data)}
          onDelete={() => {
            if (activeShopper.id && window.confirm('Are you sure you want to delete this shopper?')) {
              remove(activeShopper.id);
              setSelectedShopperId(null);
            }
          }}
        />
      )}
    </div>
  );
};

export default QAPage;
