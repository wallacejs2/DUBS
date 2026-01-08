


import { useState, useEffect, useCallback } from 'react';
import { db } from './db.ts';
import { 
  Dealership, DealershipWithRelations, EnterpriseGroup, 
  Shopper, Order 
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

export function useDealerships(filters?: { search?: string; status?: string; group?: string }) {
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
