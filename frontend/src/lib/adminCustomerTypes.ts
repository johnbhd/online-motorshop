export type AdminCustomerBranch = {
  id: number;
  name: string;
  orders: number;
};

export type AdminCustomerOrder = {
  id: number;
  reference: string;
  status: string;
  fulfillment_method: string;
  fulfillment_status: string | null;
  payment_status: string;
  total_amount: number;
  created_at: string | null;
  updated_at: string | null;
  branch: { id: number; name: string } | null;
};

export type AdminCustomer = {
  id: number;
  name: string;
  initials: string;
  type: "registered" | "guest" | string;
  contact: string;
  email: string;
  address: string | null;
  account_status: "active" | "inactive" | null;
  account_created_at: string | null;
  customer_since: string | null;
  orders: number;
  active_orders: number;
  completed_orders: number;
  last_order_at: string | null;
  last_order: AdminCustomerOrder | null;
  branches: AdminCustomerBranch[];
};

export type AdminCustomerDetail = AdminCustomer & {
  account: {
    id: number;
    email: string;
    status: string;
    created_at: string | null;
  } | null;
  summary: {
    orders: number;
    active_orders: number;
    completed_orders: number;
    branches_used: number;
    last_order: AdminCustomerOrder | null;
  };
  orders: AdminCustomerOrder[];
};

export type AdminCustomerListResponse = {
  summary: {
    total: number;
    registered: number;
    guest: number;
    customers_with_active_orders: number;
  };
  customers: AdminCustomer[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type AdminCustomerResponse = {
  customer: AdminCustomerDetail;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type AdminCustomerMutationResponse = {
  message: string;
  customer: AdminCustomer;
};

export type AdminCustomerPayload = {
  name: string;
  email: string;
  contact_number: string;
  address: string;
  status?: "active" | "inactive";
};
