


import { 
  Dealership, EnterpriseGroup, Order, Shopper, 
  DealershipWithRelations, WebsiteLink, DealershipContacts, 
  ReynoldsSolution, DealershipStatus, CRMProvider, ProductCode, 
  OrderStatus, ShopperStatus, ShopperPriority 
} from './types';

// Pure LocalStorage implementation for a seamless offline-first experience
class CuratorLocalDB extends EventTarget {
  private static instance: CuratorLocalDB;
  private storageKey = 'curator_management_v1';

  private data: {
    dealerships: Dealership[];
    enterpriseGroups: EnterpriseGroup[];
    websiteLinks: WebsiteLink[];
    contacts: DealershipContacts[];
    reynoldsSolutions: ReynoldsSolution[];
    orders: Order[];
    shoppers: Shopper[];
  } = {
    dealerships: [],
    enterpriseGroups: [],
    websiteLinks: [],
    contacts: [],
    reynoldsSolutions: [],
    orders: [],
    shoppers: []
  };

  private constructor() {
    super();
    this.load();
    if (this.data.dealerships.length === 0) {
      this.seed();
    }
  }

  static getInstance() {
    if (!CuratorLocalDB.instance) CuratorLocalDB.instance = new CuratorLocalDB();
    return CuratorLocalDB.instance;
  }

  private load() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        this.data = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse LocalDB data", e);
      }
    }
  }

  private save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    this.dispatchEvent(new CustomEvent('change'));
  }

  private seed() {
    const groupId = crypto.randomUUID();
    this.data.enterpriseGroups = [{
      id: groupId,
      name: 'Penske Automotive Group',
      description: 'A leading international transportation services company.',
      created_at: new Date().toISOString(),
      pp_sys_id: 'PP-100',
      era_system_id: 'ERA-X82'
    }];

    const dealerId = crypto.randomUUID();
    this.data.dealerships = [{
      id: dealerId,
      name: 'Penske Toyota of Cerritos',
      enterprise_group_id: groupId,
      status: DealershipStatus.LIVE,
      crm_provider: CRMProvider.CDK,
      contract_value: 125000,
      purchase_date: '2023-01-15',
      go_live_date: '2023-02-01',
      address_line1: '12255 South St',
      city: 'Cerritos',
      state: 'CA',
      zip_code: '90703',
      cif_number: 'CIF-9921',
      era_system_id: 'ERA-X82',
      pp_sys_id: 'PP-100',
      store_number: '442',
      branch_number: '12',
      bu_id: 'BU-WEST',
      is_favorite: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }];

    this.data.websiteLinks = [{
      id: crypto.randomUUID(),
      dealership_id: dealerId,
      primary_url: 'https://www.pensketoyotacerritos.com',
      client_id: 'PENSKE-77'
    }];

    this.data.contacts = [{
      id: crypto.randomUUID(),
      dealership_id: dealerId,
      sales_contact_name: 'Robert Miller',
      enrollment_contact_name: 'Sarah Chen',
      assigned_specialist_name: 'Jordan Smith',
      poc_name: 'Mike Johnson',
      poc_phone: '(562) 555-0123',
      poc_email: 'mjohnson@penske.com'
    }];

    this.data.orders = [{
      id: crypto.randomUUID(),
      dealership_id: dealerId,
      order_number: 'ORD-5521',
      received_date: new Date().toISOString(),
      status: OrderStatus.COMPLETED,
      products: [
        {
          id: crypto.randomUUID(),
          product_code: ProductCode.P15392_MANAGED,
          amount: 4500
        }
      ]
    }];

    this.data.shoppers = [{
      id: crypto.randomUUID(),
      first_name: 'Michael',
      last_name: 'Tester',
      email: 'm.tester@qa-curator.io',
      phone: '310-555-9012',
      status: ShopperStatus.ACTIVE,
      priority: ShopperPriority.HIGH,
      username: 'mtester_qa',
      password: 'SafePassword123!',
      created_at: new Date().toISOString()
    }];

    this.save();
  }

  // Enterprise Groups
  getEnterpriseGroups() { return [...this.data.enterpriseGroups]; }
  upsertEnterpriseGroup(group: Partial<EnterpriseGroup>) {
    const id = group.id || crypto.randomUUID();
    const existingIndex = this.data.enterpriseGroups.findIndex(g => g.id === id);
    const newGroup = {
      ...this.data.enterpriseGroups[existingIndex],
      ...group,
      id,
      created_at: existingIndex >= 0 ? this.data.enterpriseGroups[existingIndex].created_at : new Date().toISOString()
    } as EnterpriseGroup;
    if (existingIndex >= 0) this.data.enterpriseGroups[existingIndex] = newGroup;
    else this.data.enterpriseGroups.push(newGroup);
    this.save();
    return id;
  }
  deleteEnterpriseGroup(id: string) {
    this.data.enterpriseGroups = this.data.enterpriseGroups.filter(g => g.id !== id);
    this.data.dealerships = this.data.dealerships.map(d => 
      d.enterprise_group_id === id ? { ...d, enterprise_group_id: undefined } : d
    );
    this.save();
  }

  // Dealerships
  getDealerships() { return [...this.data.dealerships]; }
  getDealershipWithRelations(id: string): DealershipWithRelations | null {
    const dealer = this.data.dealerships.find(d => d.id === id);
    if (!dealer) return null;

    return {
      ...dealer,
      enterprise_group: this.data.enterpriseGroups.find(g => g.id === dealer.enterprise_group_id),
      website_links: this.data.websiteLinks.filter(l => l.dealership_id === id),
      contacts: this.data.contacts.find(c => c.dealership_id === id),
      reynolds_solution: this.data.reynoldsSolutions.find(r => r.dealership_id === id),
      orders: this.data.orders.filter(o => o.dealership_id === id)
    };
  }

  upsertDealership(payload: Partial<DealershipWithRelations>) {
    const id = payload.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const existingIndex = this.data.dealerships.findIndex(d => d.id === id);
    const dealershipBase: Dealership = {
      id,
      name: payload.name || 'Untitled Dealership',
      enterprise_group_id: payload.enterprise_group_id,
      status: payload.status || DealershipStatus.DMT_PENDING,
      crm_provider: payload.crm_provider || CRMProvider.FOCUS,
      website_provider: payload.website_provider,
      inventory_provider: payload.inventory_provider,
      contract_value: payload.contract_value || 0,
      purchase_date: payload.purchase_date || now,
      go_live_date: payload.go_live_date,
      term_date: payload.term_date,
      cif_number: payload.cif_number,
      era_system_id: payload.era_system_id,
      pp_sys_id: payload.pp_sys_id,
      store_number: payload.store_number,
      branch_number: payload.branch_number,
      bu_id: payload.bu_id,
      address_line1: payload.address_line1 || '',
      address_line2: payload.address_line2,
      city: payload.city || '',
      state: payload.state || '',
      zip_code: payload.zip_code || '',
      hold_reason: payload.hold_reason,
      is_favorite: payload.is_favorite !== undefined ? payload.is_favorite : (existingIndex >= 0 ? this.data.dealerships[existingIndex].is_favorite : false),
      created_at: existingIndex >= 0 ? this.data.dealerships[existingIndex].created_at : now,
      updated_at: now
    };

    if (existingIndex >= 0) {
      this.data.dealerships[existingIndex] = dealershipBase;
    } else {
      this.data.dealerships.push(dealershipBase);
    }

    // Website Links
    if (payload.website_links) {
      this.data.websiteLinks = this.data.websiteLinks.filter(l => l.dealership_id !== id);
      payload.website_links.forEach(link => {
        if (link.primary_url) {
          this.data.websiteLinks.push({ ...link, id: link.id || crypto.randomUUID(), dealership_id: id });
        }
      });
    }

    // Contacts
    if (payload.contacts) {
      this.data.contacts = this.data.contacts.filter(c => c.dealership_id !== id);
      this.data.contacts.push({ ...payload.contacts, id: payload.contacts.id || crypto.randomUUID(), dealership_id: id });
    }

    // Reynolds Solution (kept for legacy support if needed, though not in new spec)
    if (payload.reynolds_solution) {
      this.data.reynoldsSolutions = this.data.reynoldsSolutions.filter(r => r.dealership_id !== id);
      this.data.reynoldsSolutions.push({ ...payload.reynolds_solution, id: payload.reynolds_solution.id || crypto.randomUUID(), dealership_id: id });
    }

    // Orders
    if (payload.orders) {
      this.data.orders = this.data.orders.filter(o => o.dealership_id !== id);
      payload.orders.forEach(order => {
        this.data.orders.push({ 
           ...order, 
           id: order.id || crypto.randomUUID(), 
           dealership_id: id,
           products: order.products || [] 
        });
      });
    }

    this.save();
    return id;
  }

  toggleDealershipFavorite(id: string) {
    const dealer = this.data.dealerships.find(d => d.id === id);
    if (dealer) {
      dealer.is_favorite = !dealer.is_favorite;
      this.save();
    }
  }

  deleteDealership(id: string) {
    this.data.dealerships = this.data.dealerships.filter(d => d.id !== id);
    this.data.websiteLinks = this.data.websiteLinks.filter(l => l.dealership_id !== id);
    this.data.contacts = this.data.contacts.filter(c => c.dealership_id !== id);
    this.data.reynoldsSolutions = this.data.reynoldsSolutions.filter(r => r.dealership_id !== id);
    this.data.orders = this.data.orders.filter(o => o.dealership_id !== id);
    this.save();
  }

  // Orders
  getOrders(dealerId?: string) { 
    return dealerId ? this.data.orders.filter(o => o.dealership_id === dealerId) : [...this.data.orders]; 
  }
  upsertOrder(order: Partial<Order>) {
    const id = order.id || crypto.randomUUID();
    const existingIndex = this.data.orders.findIndex(o => o.id === id);
    const newOrder = {
      ...this.data.orders[existingIndex],
      ...order,
      id,
    } as Order;
    if (existingIndex >= 0) this.data.orders[existingIndex] = newOrder;
    else this.data.orders.push(newOrder);
    this.save();
    return id;
  }
  deleteOrder(id: string) {
    this.data.orders = this.data.orders.filter(o => o.id !== id);
    this.save();
  }

  // Shoppers
  getShoppers() { return [...this.data.shoppers]; }
  upsertShopper(shopper: Partial<Shopper>) {
    const id = shopper.id || crypto.randomUUID();
    const existingIndex = this.data.shoppers.findIndex(s => s.id === id);
    const newShopper = {
      ...this.data.shoppers[existingIndex],
      ...shopper,
      id,
      created_at: existingIndex >= 0 ? this.data.shoppers[existingIndex].created_at : new Date().toISOString()
    } as Shopper;
    if (existingIndex >= 0) this.data.shoppers[existingIndex] = newShopper;
    else this.data.shoppers.push(newShopper);
    this.save();
    return id;
  }
  deleteShopper(id: string) {
    this.data.shoppers = this.data.shoppers.filter(s => s.id !== id);
    this.save();
  }
}

export const db = CuratorLocalDB.getInstance();
