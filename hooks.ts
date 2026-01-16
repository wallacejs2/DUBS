
import { useState, useEffect, useCallback } from 'react';
import { db } from './db.ts';
import { 
  Dealership, DealershipWithRelations, EnterpriseGroup, 
  Shopper, Order, ProductCode, NewFeature
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

export function useDealerships(filters?: { search?: string; status?: string; group?: string; issue?: string; managed?: string; addl_web?: string }) {
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    let data = db.getDealerships();
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      data = data.filter(d => d.name.toLowerCase().includes(s) || d.city.toLowerCase().includes(s));
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
         return details?.orders?.some(o => o.products?.some(p => p.product_code === ProductCode.P15435_ADDL_WEB));
      });
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
           return details.orders?.some(o => o.products?.some(p => !p.amount));
        }

        if (filters.issue === 'no_csm') {
           return !details.contacts?.assigned_specialist_name || details.contacts.assigned_specialist_name.trim().length === 0;
        }
        
        return true;
      });
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

export function useNewFeatures(filters?: { search?: string; quarter?: string; year?: string; type?: string; status?: string }) {
  const [features, setFeatures] = useState<NewFeature[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    let data = db.getNewFeatures();
    
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      data = data.filter(f => 
        f.title.toLowerCase().includes(s) || 
        (f.description && f.description.toLowerCase().includes(s)) ||
        (f.pmr_number && f.pmr_number.toLowerCase().includes(s))
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
    loading,
    upsert: (f: Partial<NewFeature>) => db.upsertNewFeature(f),
    remove: (id: string) => db.deleteNewFeature(id)
  };
}
