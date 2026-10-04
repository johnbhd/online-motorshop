export type StaffCustomerBranch = {
  id: number;
  name: string;
};

export type StaffCustomerOrderSummary = {
  id: number;
  reference: string;
  status: string;
  fulfillment_method: string;
  fulfillment_status: string | null;
  payment_status: string;
  total_amount: number;
  created_at: string | null;
  updated_at: string | null;
  branch: StaffCustomerBranch | null;
};

export type StaffCustomerSummary = {
  id: number;
  name: string;
  initials: string;
  type: "registered" | "guest";
  contact: string | null;
  email: string | null;
  address: string | null;
  branch: StaffCustomerBranch;
  orders: number;
  active_orders: number;
  completed_orders: number;
  customer_since: string | null;
  last_order: StaffCustomerOrderSummary | null;
};

export type StaffCustomersSummary = {
  total: number;
  registered: number;
  guest: number;
  active_orders: number;
};

export type StaffCustomersMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type StaffCustomersResponse = {
  summary: StaffCustomersSummary;
  customers: StaffCustomerSummary[];
  meta: StaffCustomersMeta;
};

export type StaffCustomerProfile = Omit<
  StaffCustomerSummary,
  "orders" | "active_orders" | "completed_orders" | "last_order"
>;

export type StaffCustomerDetails = {
  customer: StaffCustomerProfile;
  summary: {
    orders: number;
    active_orders: number;
    completed_orders: number;
    last_order: StaffCustomerOrderSummary | null;
  };
  active_orders: StaffCustomerOrderSummary[];
  recent_orders: StaffCustomerOrderSummary[];
  meta: {
    returned_orders: number;
    order_limit: number;
  };
};
