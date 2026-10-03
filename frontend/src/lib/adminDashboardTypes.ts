export type AdminDashboardSummary = {
  total_orders: number;
  active_orders: number;
  pending_orders: number;
  payments_attention: number;
  pickups_attention: number;
  deliveries_attention: number;
  active_fulfillment: number;
  conversations: number;
  customers: number;
  registered_customers: number;
  guest_customers: number;
  staff: number;
  products: number;
  branches: number;
};

export type AdminDashboardBranch = {
  id: number;
  name: string;
  orders: number;
  active_orders: number;
  pending_orders: number;
  pickup_requests: number;
  delivery_requests: number;
};

export type AdminDashboardCustomer = {
  id: number;
  full_name: string;
  contact_number: string;
  email: string;
};

export type AdminDashboardRecentOrder = {
  id: number;
  reference: string;
  customer: AdminDashboardCustomer | null;
  status: string;
  payment_status: string;
  fulfillment_method: string;
  branch: {
    id: number;
    name: string;
  } | null;
  item_count: number;
  line_item_count: number;
  subtotal: number;
  delivery_fee: number;
  estimated_total: number;
  total_amount: number;
  created_at: string | null;
  updated_at: string | null;
};

export type AdminDashboardResponse = {
  summary: AdminDashboardSummary;
  branches: AdminDashboardBranch[];
  recent_orders: AdminDashboardRecentOrder[];
};
