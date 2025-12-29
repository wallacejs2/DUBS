
import { 
  Dealership, EnterpriseGroup, Order, Shopper, 
  DealershipWithRelations, WebsiteLink, DealershipContacts, 
  ReynoldsSolution, DealershipStatus, CRMProvider, ProductCode, 
  OrderStatus, ShopperStatus, ShopperPriority 
} from './types';

// Mock DB implementation using LocalStorage
class BoltDB extends EventTarget {
  private static instance: BoltDB;
  private storageKey = 'curator_bolt_db';

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
    if (!BoltDB.instance) BoltDB.instance = new BoltDB();
    return BoltDB.instance;
  }

  private load() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        this.data = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse BoltDB data", e);
      }
    }
  }

  private save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    this.dispatchEvent(new CustomEvent('change'));
  }

  private seed() {
    const groupId = 'group-1';
    this.data.enterpriseGroups = [{
      id: groupId,
      name: 'Penske Automotive Group',
      description: 'Global automotive retailer',
      created_at: new Date().toISOString()
    }];

    const dealerId = 'dealer-1';
    this.data.dealerships = [{
      id: dealerId,
      name: 'Penske Toyota of Cerritos',
      enterprise_group_id: groupId,
      status: DealershipStatus.LIVE,
      crm_provider: CRMProvider.CDK,
      contract_value: 5000,
      purchase_date: '2023-01-15',
      address_line1: '12345 Cerritos Blvd',
      city: 'Cerritos',
      state: 'CA',
      zip_code: '90703',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }];

    this.data.websiteLinks = [{
      id: 'link-1',
      dealership_id: dealerId,
      primary_url: 'https://www.pensketoyotacerritos.com'
    }];

    this.data.contacts = [{
      id: 'contact-1',
      dealership_id: dealerId,
      sales_contact_name: 'John Sales',
      enrollment_contact_name: 'Jane Enroll',
      assigned_specialist_name: 'Steve Expert',
      poc_name: 'Dealer Manager',
      poc_phone: '555-0199',
      poc_email: 'manager@pensketoyota.com'
    }];

    this.data.orders = [{
      id: 'order-1',
      dealership_id: dealerId,
      order_number: 'ORD-1001',
      product_name: 'Managed SEO',
      product_code: ProductCode.P15392Managed,
      amount: 1200,
      order_date: new Date().toISOString(),
      status: OrderStatus.COMPLETED
    }];

    this.data.shoppers = [{
      id: 'shopper-1',
      first_name: 'Alex',
      last_name: 'Tester',
      email: 'alex@qa.com',
      phone: '555-9988',
      status: ShopperStatus.ACTIVE,
      priority: ShopperPriority.HIGH,
      username: 'alexqa',
      password: 'password123',
      created_at: new Date().toISOString()
    }];

    this.save();
  }

  // API Methods
  getEnterpriseGroups() { return [...this.data.enterpriseGroups]; }
  getDealerships() { return [...this.data.dealerships]; }
  getShoppers() { return [...this.data.shoppers]; }
  getOrders(dealerId?: string) { 
    return dealerId ? this.data.orders.filter(o => o.dealership_id === dealerId) : [...this.data.orders]; 
  }

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
      crm_provider: payload.crm_provider || CRMProvider.OTHER,
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
      created_at: existingIndex >= 0 ? this.data.dealerships[existingIndex].created_at : now,
      updated_at: now
    };

    if (existingIndex >= 0) {
      this.data.dealerships[existingIndex] = dealershipBase;
    } else {
      this.data.dealerships.push(dealershipBase);
    }

    // Handle relations
    if (payload.website_links) {
      this.data.websiteLinks = this.data.websiteLinks.filter(l => l.dealership_id !== id);
      payload.website_links.forEach(link => {
        this.data.websiteLinks.push({ ...link, id: link.id || crypto.randomUUID(), dealership_id: id });
      });
    }

    if (payload.contacts) {
      this.data.contacts = this.data.contacts.filter(c => c.dealership_id !== id);
      this.data.contacts.push({ ...payload.contacts, id: payload.contacts.id || crypto.randomUUID(), dealership_id: id });
    }

    if (payload.reynolds_solution) {
      this.data.reynoldsSolutions = this.data.reynoldsSolutions.filter(r => r.dealership_id !== id);
      this.data.reynoldsSolutions.push({ ...payload.reynolds_solution, id: payload.reynolds_solution.id || crypto.randomUUID(), dealership_id: id });
    }

    this.save();
    return id;
  }

  deleteDealership(id: string) {
    this.data.dealerships = this.data.dealerships.filter(d => d.id !== id);
    this.data.websiteLinks = this.data.websiteLinks.filter(l => l.dealership_id !== id);
    this.data.contacts = this.data.contacts.filter(c => c.dealership_id !== id);
    this.data.reynoldsSolutions = this.data.reynoldsSolutions.filter(r => r.dealership_id !== id);
    this.data.orders = this.data.orders.filter(o => o.dealership_id !== id);
    this.save();
  }

  upsertEnterpriseGroup(group: Partial<EnterpriseGroup>) {
    const id = group.id || crypto.randomUUID();
    const existingIndex = this.data.enterpriseGroups.findIndex(g => g.id === id);
    const newGroup = {
      id,
      name: group.name || 'New Group',
      description: group.description || '',
      created_at: existingIndex >= 0 ? this.data.enterpriseGroups[existingIndex].created_at : new Date().toISOString()
    };
    if (existingIndex >= 0) this.data.enterpriseGroups[existingIndex] = newGroup;
    else this.data.enterpriseGroups.push(newGroup);
    this.save();
    return id;
  }

  deleteEnterpriseGroup(id: string) {
    this.data.enterpriseGroups = this.data.enterpriseGroups.filter(g => g.id !== id);
    // Unset group from dealerships
    this.data.dealerships = this.data.dealerships.map(d => 
      d.enterprise_group_id === id ? { ...d, enterprise_group_id: undefined } : d
    );
    this.save();
  }

  upsertShopper(shopper: Partial<Shopper>) {
    const id = shopper.id || crypto.randomUUID();
    const existingIndex = this.data.shoppers.findIndex(s => s.id === id);
    const newShopper = {
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

  upsertOrder(order: Partial<Order>) {
    const id = order.id || crypto.randomUUID();
    const existingIndex = this.data.orders.findIndex(o => o.id === id);
    const newOrder = {
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
}

export const db = BoltDB.getInstance();
