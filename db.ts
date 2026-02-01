
import { 
  Dealership, EnterpriseGroup, Order, Shopper, NewFeature, TeamMember,
  DealershipWithRelations, WebsiteLink, DealershipContacts, 
  ReynoldsSolution, DealershipStatus, CRMProvider, ProductCode, 
  OrderStatus, ShopperStatus, ShopperPriority, TeamRole,
  ProviderProduct, ProviderProductCategory, ProviderType
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
    newFeatures: NewFeature[];
    teamMembers: TeamMember[];
    providersProducts: ProviderProduct[];
  } = {
    dealerships: [],
    enterpriseGroups: [],
    websiteLinks: [],
    contacts: [],
    reynoldsSolutions: [],
    orders: [],
    shoppers: [],
    newFeatures: [],
    teamMembers: [],
    providersProducts: []
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

  private generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for environments where crypto.randomUUID is not available
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private load() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.data = {
          ...this.data,
          ...parsed,
          // Ensure new fields exist if loading from old DB structure
          newFeatures: parsed.newFeatures || [],
          teamMembers: parsed.teamMembers || [],
          providersProducts: parsed.providersProducts || []
        };
      } catch (e) {
        console.error("Failed to parse LocalDB data", e);
      }
    }
  }

  private save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      this.dispatchEvent(new CustomEvent('change'));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
      // In a real app, you might want to show a toast notification here
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        alert('Local storage is full. Please clear some data to save changes.');
      }
    }
  }

  private seed() {
    const groupId = this.generateId();
    this.data.enterpriseGroups = [{
      id: groupId,
      name: 'Penske Automotive Group',
      description: 'A leading international transportation services company.',
      created_at: new Date().toISOString(),
      pp_sys_id: 'PP-100',
      era_system_id: 'ERA-X82'
    }];

    const dealerId = this.generateId();
    this.data.dealerships = [{
      id: dealerId,
      name: 'Penske Toyota of Cerritos',
      enterprise_group_id: groupId,
      status: DealershipStatus.LIVE,
      crm_provider: 'CDK',
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
      sms_activated: true,
      products: ['15392 - Managed'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }];

    this.data.websiteLinks = [{
      id: this.generateId(),
      dealership_id: dealerId,
      primary_url: 'https://www.pensketoyotacerritos.com',
      client_id: 'PENSKE-77'
    }];

    this.data.contacts = [{
      id: this.generateId(),
      dealership_id: dealerId,
      sales_contact_name: 'Robert Miller',
      enrollment_contact_name: 'Sarah Chen',
      assigned_specialist_name: 'Jordan Smith',
      poc_name: 'Mike Johnson',
      poc_phone: '(562) 555-0123',
      poc_email: 'mjohnson@penske.com'
    }];

    this.data.orders = [{
      id: this.generateId(),
      dealership_id: dealerId,
      order_number: 'ORD-5521',
      received_date: new Date().toISOString(),
      status: OrderStatus.COMPLETED,
      products: [
        {
          id: this.generateId(),
          product_code: ProductCode.P15392_MANAGED,
          amount: 4500
        }
      ]
    }];

    this.data.shoppers = [{
      id: this.generateId(),
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

    this.data.newFeatures = [{
      id: this.generateId(),
      title: 'Enhanced VIN Decoding',
      quarterly_release: 'Q1 2025',
      type: 'New',
      status: 'Pending',
      platform: 'Curator',
      navigation: 'Inventory > Settings > Decoding',
      location: 'Global',
      launch_date: '2025-03-15',
      pmrs: [
        { id: this.generateId(), number: 'PMR-2025-001', link: 'https://jira.company.com/browse/PMR-001' }
      ],
      support_material_link: 'https://docs.company.com/vin-decoding',
      description: 'Upgrading the core VIN decoding engine to support 2026 EV models and improved option code parsing.',
      created_at: new Date().toISOString()
    }];

    // Seed Team Members
    this.data.teamMembers = [
      {
        id: this.generateId(),
        name: 'Jordan Smith',
        role: TeamRole.CSM,
        user_id: 'jsmith22',
        email: 'j.smith@company.com',
        phone: '555-0199',
        created_at: new Date().toISOString()
      },
      {
        id: this.generateId(),
        name: 'Robert Miller',
        role: TeamRole.SALES,
        user_id: 'rmiller1',
        email: 'r.miller@company.com',
        phone: '555-0245',
        created_at: new Date().toISOString()
      },
      {
        id: this.generateId(),
        name: 'Sarah Chen',
        role: TeamRole.ENROLLMENT,
        user_id: 'schen99',
        email: 's.chen@company.com',
        phone: '555-0312',
        created_at: new Date().toISOString()
      }
    ];

    // Seed Providers and Products
    this.data.providersProducts = [
      {
        id: this.generateId(),
        name: 'CDK Global',
        category: ProviderProductCategory.PROVIDER,
        provider_type: ProviderType.CRM,
        support_email: 'support@cdk.com',
        support_phone: '800-555-0199',
        support_link: 'https://support.cdk.com',
        notes: 'Main CRM provider for large enterprise groups.',
        created_at: new Date().toISOString()
      },
      {
        id: this.generateId(),
        name: 'Dealer.com',
        category: ProviderProductCategory.PROVIDER,
        provider_type: ProviderType.WEBSITE,
        support_email: 'web-support@dealer.com',
        support_link: 'https://dealer.com/help',
        created_at: new Date().toISOString()
      },
      {
        id: this.generateId(),
        name: '15392 - Managed',
        category: ProviderProductCategory.PRODUCT,
        notes: 'Full service managed solutions product.',
        created_at: new Date().toISOString()
      },
      {
        id: this.generateId(),
        name: 'DealerVault',
        category: ProviderProductCategory.PROVIDER,
        provider_type: ProviderType.INVENTORY,
        created_at: new Date().toISOString()
      }
    ];

    this.save();
  }

  // Enterprise Groups
  getEnterpriseGroups() { return [...this.data.enterpriseGroups]; }
  upsertEnterpriseGroup(group: Partial<EnterpriseGroup>) {
    const id = group.id || this.generateId();
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
    const id = payload.id || this.generateId();
    const now = new Date().toISOString();

    const existingIndex = this.data.dealerships.findIndex(d => d.id === id);
    const existing = existingIndex >= 0 ? this.data.dealerships[existingIndex] : {} as Dealership;

    // Destructure to separate relations from base dealership data
    const { 
      enterprise_group, website_links, contacts, reynolds_solution, orders, 
      ...dealershipData 
    } = payload;

    const dealershipBase: Dealership = {
      ...existing, // Use existing data as base to support partial updates
      ...dealershipData, // Overwrite with provided data
      id,
      // Ensure required fields have defaults if this is a new record
      name: dealershipData.name ?? existing.name ?? 'Untitled Dealership',
      status: dealershipData.status ?? existing.status ?? DealershipStatus.DMT_PENDING,
      crm_provider: dealershipData.crm_provider ?? existing.crm_provider ?? 'FOCUS',
      address_line1: dealershipData.address_line1 ?? existing.address_line1 ?? '',
      city: dealershipData.city ?? existing.city ?? '',
      state: dealershipData.state ?? existing.state ?? '',
      zip_code: dealershipData.zip_code ?? existing.zip_code ?? '',
      contract_value: dealershipData.contract_value ?? existing.contract_value ?? 0,
      purchase_date: dealershipData.purchase_date ?? existing.purchase_date ?? now,
      products: dealershipData.products ?? existing.products ?? [],
      
      created_at: existing.created_at || now,
      updated_at: now
    };

    if (existingIndex >= 0) {
      this.data.dealerships[existingIndex] = dealershipBase;
    } else {
      this.data.dealerships.push(dealershipBase);
    }

    // Website Links
    if (website_links) {
      this.data.websiteLinks = this.data.websiteLinks.filter(l => l.dealership_id !== id);
      website_links.forEach(link => {
        if (link.primary_url) {
          this.data.websiteLinks.push({ ...link, id: link.id || this.generateId(), dealership_id: id });
        }
      });
    }

    // Contacts
    if (contacts) {
      this.data.contacts = this.data.contacts.filter(c => c.dealership_id !== id);
      this.data.contacts.push({ ...contacts, id: contacts.id || this.generateId(), dealership_id: id });
    }

    // Reynolds Solution (legacy support)
    if (reynolds_solution) {
      this.data.reynoldsSolutions = this.data.reynoldsSolutions.filter(r => r.dealership_id !== id);
      this.data.reynoldsSolutions.push({ ...reynolds_solution, id: reynolds_solution.id || this.generateId(), dealership_id: id });
    }

    // Orders
    if (orders) {
      this.data.orders = this.data.orders.filter(o => o.dealership_id !== id);
      orders.forEach(order => {
        this.data.orders.push({ 
           ...order, 
           id: order.id || this.generateId(), 
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
    const id = order.id || this.generateId();
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
    const id = shopper.id || this.generateId();
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

  // New Features
  getNewFeatures() { return [...this.data.newFeatures]; }
  upsertNewFeature(feature: Partial<NewFeature>) {
    const id = feature.id || this.generateId();
    const existingIndex = this.data.newFeatures.findIndex(f => f.id === id);
    const newFeature = {
      ...this.data.newFeatures[existingIndex],
      ...feature,
      id,
      created_at: existingIndex >= 0 ? this.data.newFeatures[existingIndex].created_at : new Date().toISOString()
    } as NewFeature;
    if (existingIndex >= 0) this.data.newFeatures[existingIndex] = newFeature;
    else this.data.newFeatures.push(newFeature);
    this.save();
    return id;
  }
  deleteNewFeature(id: string) {
    this.data.newFeatures = this.data.newFeatures.filter(f => f.id !== id);
    this.save();
  }

  // Team Members
  getTeamMembers() { return [...this.data.teamMembers]; }
  upsertTeamMember(member: Partial<TeamMember>) {
    const id = member.id || this.generateId();
    const existingIndex = this.data.teamMembers.findIndex(m => m.id === id);
    const newMember = {
      ...this.data.teamMembers[existingIndex],
      ...member,
      id,
      created_at: existingIndex >= 0 ? this.data.teamMembers[existingIndex].created_at : new Date().toISOString()
    } as TeamMember;
    if (existingIndex >= 0) this.data.teamMembers[existingIndex] = newMember;
    else this.data.teamMembers.push(newMember);
    this.save();
    return id;
  }
  deleteTeamMember(id: string) {
    this.data.teamMembers = this.data.teamMembers.filter(m => m.id !== id);
    this.save();
  }

  // Providers & Products
  getProvidersProducts() { return [...this.data.providersProducts]; }
  upsertProviderProduct(pp: Partial<ProviderProduct>) {
    const id = pp.id || this.generateId();
    const existingIndex = this.data.providersProducts.findIndex(p => p.id === id);
    const newItem = {
      ...this.data.providersProducts[existingIndex],
      ...pp,
      id,
      created_at: existingIndex >= 0 ? this.data.providersProducts[existingIndex].created_at : new Date().toISOString()
    } as ProviderProduct;
    if (existingIndex >= 0) this.data.providersProducts[existingIndex] = newItem;
    else this.data.providersProducts.push(newItem);
    this.save();
    return id;
  }
  deleteProviderProduct(id: string) {
    this.data.providersProducts = this.data.providersProducts.filter(p => p.id !== id);
    this.save();
  }
}

export const db = CuratorLocalDB.getInstance();
