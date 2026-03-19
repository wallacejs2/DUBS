
import { useState, useEffect, useCallback } from 'react';
import { db } from './db.ts';
import {
  Dealership, DealershipWithRelations, EnterpriseGroup,
  Shopper, Order, ProductCode, NewFeature, TeamMember,
  ProviderProduct, Meeting, Note, Task
} from './types.ts';

export function useEnterpriseGroups() {
  const [groups, setGroups] = useState<EnterpriseGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    const data = db.getEnterpriseGroups();
    const dealerships = db.getDealerships();
    const enriched = data.map(g => ({
      ...g,
      dealershipCount: dealerships.filter(d => d.enterprise_group_id === g.id).length
    }));
    
    // Sort alphabetically
    enriched.sort((a, b) => a.name.localeCompare(b.name));
    
    setGroups(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
    db.addEventListener('change', fetch);
    return () => db.removeEventListener('change', fetch);
  }, [fetch]);

  return { 
    groups, 
    loading, 
    upsert: (g: Partial<EnterpriseGroup>) => db.upsertEnterpriseGroup(g),
    remove: (id: string) => db.deleteEnterpriseGroup(id)
  };
}

export function useDealerships(filters?: { search?: string; status?: string; group?: string; issue?: string; managed?: string; addl_web?: string; cif?: string; client_id?: string; sms?: string; received_month?: string; onboarding_month?: string; go_live_month?: string; term_month?: string }) {
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    const getMonthKey = (dateValue?: string): string => {
      if (!dateValue) return '';
      const raw = dateValue.slice(0, 7);
      if (/^\d{4}-\d{2}$/.test(raw)) return raw;
      const parsed = new Date(dateValue);
      if (Number.isNaN(parsed.getTime())) return '';
      return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
    };

    let data = db.getDealerships();
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      data = data.filter(d => d.name.toLowerCase().includes(s) || d.city.toLowerCase().includes(s));
    }
    if (filters?.cif) {
      const cif = filters.cif.toLowerCase();
      data = data.filter(d => d.cif_number && d.cif_number.toLowerCase().includes(cif));
    }
    if (filters?.client_id) {
      const clientId = filters.client_id.toLowerCase().trim();
      data = data.filter(d => {
        const details = db.getDealershipWithRelations(d.id);
        return details?.website_links?.some(link => link.client_id?.toLowerCase().includes(clientId));
      });
    }
    if (filters?.status) {
      data = data.filter(d => d.status === filters.status);
    }
    if (filters?.group) {
      data = data.filter(d => d.enterprise_group_id === filters.group);
    }
    if (filters?.managed === 'yes') {
      data = data.filter(d => {
         const details = db.getDealershipWithRelations(d.id);
         return details?.orders?.some(o => o.products?.some(p => p.product_code === ProductCode.P15392_MANAGED));
      });
    }
    if (filters?.addl_web === 'yes') {
      data = data.filter(d => {
         const details = db.getDealershipWithRelations(d.id);
         return details?.orders?.some(o => o.products?.some(p => p.product_code === ProductCode.P15435_ADDL_WEB || p.product_code === ProductCode.P15436_MNGD_ADDL));
      });
    }
    if (filters?.sms === 'yes') {
      data = data.filter(d => d.sms_activated);
    }
    if (filters?.issue) {
      data = data.filter(d => {
        const details = db.getDealershipWithRelations(d.id);
        if (!details) return false;
        
        if (filters.issue === 'no_id') {
           const hasClientId = details.website_links?.some(l => l.client_id && l.client_id.trim().length > 0) ?? false;
           return !hasClientId;
        }

        if (filters.issue === 'zero_price') {
           return details.orders?.some(o => o.products?.some(p => p.amount == null));
        }

        if (filters.issue === 'no_csm') {
           return !details.contacts?.assigned_specialist_name || details.contacts.assigned_specialist_name.trim().length === 0;
        }

        if (filters.issue === 'no_enrollment') {
           return !details.contacts?.enrollment_contact_name || details.contacts.enrollment_contact_name.trim().length === 0;
        }

        if (filters.issue === 'no_poc') {
           return !details.contacts?.poc_email || details.contacts.poc_email.trim().length === 0;
        }

        if (filters.issue === 'no_web_provider') {
           return !d.website_provider || d.website_provider.trim().length === 0;
        }

        if (filters.issue === 'no_inv_provider') {
           return !d.inventory_provider || d.inventory_provider.trim().length === 0;
        }

        return true;
      });
    }

    if (filters?.received_month) {
      const allOrders = db.getOrders();
      const dealerIdsWithReceivedInMonth = new Set(
        allOrders
          .filter(o => getMonthKey(o.received_date) === filters.received_month)
          .map(o => o.dealership_id)
      );
      data = data.filter(d => dealerIdsWithReceivedInMonth.has(d.id));
    }
    if (filters?.onboarding_month) {
      data = data.filter(d => getMonthKey(d.onboarding_date) === filters.onboarding_month);
    }
    if (filters?.go_live_month) {
      data = data.filter(d => getMonthKey(d.go_live_date) === filters.go_live_month);
    }
    if (filters?.term_month) {
      data = data.filter(d => getMonthKey(d.term_date) === filters.term_month);
    }

    // Sort: Favorites first, then alphabetical
    data.sort((a, b) => {
      const aFav = !!a.is_favorite;
      const bFav = !!b.is_favorite;
      if (aFav !== bFav) return aFav ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    setDealerships(data);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetch();
    db.addEventListener('change', fetch);
    return () => db.removeEventListener('change', fetch);
  }, [fetch]);

  return {
    dealerships,
    loading,
    upsert: (d: Partial<DealershipWithRelations>) => db.upsertDealership(d),
    remove: (id: string) => db.deleteDealership(id),
    getDetails: (id: string) => db.getDealershipWithRelations(id),
    toggleFavorite: (id: string) => db.toggleDealershipFavorite(id)
  };
}

export function useOrders(dealerId?: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    setOrders(db.getOrders(dealerId));
    setLoading(false);
  }, [dealerId]);

  useEffect(() => {
    fetch();
    db.addEventListener('change', fetch);
    return () => db.removeEventListener('change', fetch);
  }, [fetch]);

  return {
    orders,
    loading,
    upsert: (o: Partial<Order>) => db.upsertOrder(o),
    remove: (id: string) => db.deleteOrder(id)
  };
}

export function useShoppers(filters?: { search?: string; status?: string; priority?: string }) {
  const [shoppers, setShoppers] = useState<Shopper[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    let data = db.getShoppers();
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      data = data.filter(sh => 
        sh.first_name.toLowerCase().includes(s) || 
        sh.last_name.toLowerCase().includes(s) || 
        sh.email.toLowerCase().includes(s)
      );
    }
    if (filters?.status) data = data.filter(sh => sh.status === filters.status);
    if (filters?.priority) data = data.filter(sh => sh.priority === filters.priority);
    setShoppers(data);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetch();
    db.addEventListener('change', fetch);
    return () => db.removeEventListener('change', fetch);
  }, [fetch]);

  return {
    shoppers,
    loading,
    upsert: (s: Partial<Shopper>) => db.upsertShopper(s),
    remove: (id: string) => db.deleteShopper(id)
  };
}

export function useNewFeatures(filters?: { search?: string; quarter?: string; year?: string; type?: string; status?: string; platform?: string; source?: string }) {
  const [features, setFeatures] = useState<NewFeature[]>([]);
  const [allFeatures, setAllFeatures] = useState<NewFeature[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    let data = db.getNewFeatures();
    setAllFeatures(data);
    
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      data = data.filter(f =>
        f.title.toLowerCase().includes(s) ||
        (f.summary && f.summary.toLowerCase().includes(s)) ||
        (f.description && f.description.toLowerCase().includes(s)) ||
        (f.pmr_number && f.pmr_number.toLowerCase().includes(s)) ||
        (f.product_area && f.product_area.toLowerCase().includes(s)) ||
        (f.categories && f.categories.toLowerCase().includes(s))
      );
    }

    if (filters?.quarter) {
      data = data.filter(f => f.quarterly_release && f.quarterly_release.includes(filters.quarter));
    }

    if (filters?.year) {
      data = data.filter(f => f.quarterly_release && f.quarterly_release.includes(filters.year));
    }

    if (filters?.type) {
      data = data.filter(f => f.type === filters.type);
    }

    if (filters?.status) {
      data = data.filter(f => f.status === filters.status);
    }

    if (filters?.platform) {
      data = data.filter(f => f.platform === filters.platform);
    }

    if (filters?.source) {
      data = data.filter(f => f.source === filters.source);
    }

    // Sort by launch_date desc (newest to oldest), fallback to created_at
    data.sort((a, b) => {
      const dateA = a.launch_date ? new Date(a.launch_date).getTime() : 0;
      const dateB = b.launch_date ? new Date(b.launch_date).getTime() : 0;
      
      if (dateA !== dateB) return dateB - dateA;
      
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    setFeatures(data);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetch();
    db.addEventListener('change', fetch);
    return () => db.removeEventListener('change', fetch);
  }, [fetch]);

  return {
    features,
    allFeatures,
    loading,
    upsert: (f: Partial<NewFeature>) => db.upsertNewFeature(f),
    remove: (id: string) => db.deleteNewFeature(id)
  };
}

export function useTeamMembers(filters?: { search?: string; role?: string }) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    let data = db.getTeamMembers();
    
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      data = data.filter(m => 
        m.name.toLowerCase().includes(s) || 
        (m.email && m.email.toLowerCase().includes(s)) ||
        (m.user_id && m.user_id.toLowerCase().includes(s))
      );
    }

    if (filters?.role) {
      data = data.filter(m => m.role === filters.role);
    }

    data.sort((a, b) => a.name.localeCompare(b.name));
    
    setMembers(data);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetch();
    db.addEventListener('change', fetch);
    return () => db.removeEventListener('change', fetch);
  }, [fetch]);

  return {
    members,
    loading,
    upsert: (m: Partial<TeamMember>) => db.upsertTeamMember(m),
    remove: (id: string) => db.deleteTeamMember(id)
  };
}

export function useProvidersProducts(filters?: { search?: string; category?: string; provider_type?: string }) {
  const [items, setItems] = useState<ProviderProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    let data = db.getProvidersProducts();
    
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      data = data.filter(p => 
        p.name.toLowerCase().includes(s) || 
        (p.notes && p.notes.toLowerCase().includes(s))
      );
    }

    if (filters?.category) {
      data = data.filter(p => p.category === filters.category);
    }

    if (filters?.provider_type) {
      data = data.filter(p => p.provider_type === filters.provider_type);
    }

    data.sort((a, b) => a.name.localeCompare(b.name));
    
    setItems(data);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetch();
    db.addEventListener('change', fetch);
    return () => db.removeEventListener('change', fetch);
  }, [fetch]);

  return {
    items,
    loading,
    upsert: (p: Partial<ProviderProduct>) => db.upsertProviderProduct(p),
    remove: (id: string) => db.deleteProviderProduct(id)
  };
}

export function useMeetings(filters?: { search?: string }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    let data = db.getMeetings();

    if (filters?.search) {
      const s = filters.search.toLowerCase();
      data = data.filter(m =>
        m.name.toLowerCase().includes(s) ||
        (m.notes && m.notes.toLowerCase().includes(s))
      );
    }

    // Sort by date descending (newest first)
    data.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      if (dateA !== dateB) return dateB - dateA;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setMeetings(data);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetch();
    db.addEventListener('change', fetch);
    return () => db.removeEventListener('change', fetch);
  }, [fetch]);

  return {
    meetings,
    loading,
    upsert: (m: Partial<Meeting>) => db.upsertMeeting(m),
    remove: (id: string) => db.deleteMeeting(id)
  };
}

export function useNotes(filters?: { search?: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    let data = db.getNotes();

    if (filters?.search) {
      const s = filters.search.toLowerCase();
      data = data.filter(n =>
        n.title.toLowerCase().includes(s) ||
        (n.content && n.content.toLowerCase().includes(s))
      );
    }

    data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setNotes(data);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetch();
    db.addEventListener('change', fetch);
    return () => db.removeEventListener('change', fetch);
  }, [fetch]);

  return {
    notes,
    loading,
    upsert: (n: Partial<Note>) => db.upsertNote(n),
    remove: (id: string) => db.deleteNote(id)
  };
}

export function useTasks(filters?: { search?: string; completed?: boolean }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    let data = db.getTasks();

    if (filters?.search) {
      const s = filters.search.toLowerCase();
      data = data.filter(t =>
        t.title.toLowerCase().includes(s) ||
        (t.description && t.description.toLowerCase().includes(s))
      );
    }

    if (filters?.completed !== undefined) {
      data = data.filter(t => t.completed === filters.completed);
    }

    // Sort: incomplete first, then by created_at desc
    data.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setTasks(data);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetch();
    db.addEventListener('change', fetch);
    return () => db.removeEventListener('change', fetch);
  }, [fetch]);

  return {
    tasks,
    loading,
    upsert: (t: Partial<Task>) => db.upsertTask(t),
    remove: (id: string) => db.deleteTask(id),
    toggleComplete: (id: string) => db.toggleTaskComplete(id)
  };
}
