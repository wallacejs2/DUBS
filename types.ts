

export enum DealershipStatus {
  DMT_PENDING = 'DMT-Pending',
  DMT_APPROVED = 'DMT-Approved',
  HOLD = 'Hold',
  ONBOARDING = 'Onboarding',
  LIVE = 'Live',
  LEGACY = 'Legacy',
  CANCELLED = 'Cancelled'
}

export enum CRMProvider {
  FOCUS = 'FOCUS',
  CDK = 'CDK',
  DEALER_OWNED = 'DealerOwned',
  DEALER_SOCKET = 'DealerSocket',
  DRIVE_CENTRIC = 'DriveCentric',
  ELEAD = 'Elead',
  MOMENTUM = 'Momentum',
  OPLOGIC = 'OpLogic',
  TEKION = 'Tekion',
  VIN_SOLUTIONS = 'VinSolutions'
}

export enum ProductCode {
  P15391_SE = '15391 - SE',
  P15392_MANAGED = '15392 - Managed',
  P15435_ADDL_WEB = '15435 - Addl. Web',
  P15436_MNGD_ADDL = '15436 Mngd Addl. Web',
  P15382_PREV_SE = '15382 - Prev. SE',
  P15381_PREV_AA = '15381 - Prev. AA',
  P15390_SMS = '15390 - SMS'
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ShopperStatus {
  ACTIVE = 'active',
  TESTING = 'testing',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
  ISSUES = 'issues'
}

export enum ShopperPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface EnterpriseGroup {
  id: string;
  name: string;
  description: string;
  dealershipCount?: number;
  created_at: string;
  pp_sys_id?: string;
  era_system_id?: string;
}

export interface WebsiteLink {
  id: string;
  dealership_id: string;
  primary_url: string;
  client_id?: string;
}

export interface DealershipContacts {
  id: string;
  dealership_id: string;
  sales_contact_name: string;
  enrollment_contact_name: string;
  assigned_specialist_name: string;
  poc_name: string;
  poc_phone: string;
  poc_email: string;
}

export interface ReynoldsSolution {
  id: string;
  dealership_id: string;
  solution_details: string;
}

export interface OrderProduct {
  id: string;
  product_code: ProductCode;
  amount: number;
}

export interface Order {
  id: string;
  dealership_id: string;
  order_number: string;
  received_date: string;
  status: OrderStatus;
  products: OrderProduct[];
  notes?: string;
}

export interface Dealership {
  id: string;
  name: string;
  enterprise_group_id?: string;
  status: DealershipStatus;
  crm_provider: CRMProvider;
  contract_value: number;
  purchase_date: string;
  go_live_date?: string;
  term_date?: string;
  
  // IDs
  cif_number?: string;
  era_system_id?: string;
  pp_sys_id?: string;
  store_number?: string;
  branch_number?: string;
  bu_id?: string;
  
  // Address
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  
  created_at: string;
  updated_at: string;
}

export interface DealershipWithRelations extends Dealership {
  enterprise_group?: EnterpriseGroup;
  website_links: WebsiteLink[];
  contacts?: DealershipContacts;
  reynolds_solution?: ReynoldsSolution;
  orders: Order[];
}

export interface Shopper {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: ShopperStatus;
  priority: ShopperPriority;
  username?: string;
  password?: string;
  device_type?: string;
  browser?: string;
  test_config?: string;
  qa_details?: string;
  assigned_tester?: string;
  created_at: string;
}