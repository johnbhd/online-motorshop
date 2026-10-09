export type AdminPickupRequest = {
  id: number;
  order_reference: string | null;
  order_status: string | null;
  customer: {
    id: number;
    full_name: string;
    contact_number: string | null;
    email: string | null;
    address: string | null;
  } | null;
  branch: {
    id: number;
    name: string;
    address: string | null;
    contact_number: string | null;
  } | null;
  amount: number | null;
  payment: {
    id: number;
    method: string;
    amount: number | null;
    reference: string | null;
    status: string;
    verified_at: string | null;
  } | null;
  pickup_status: string;
  pickup_date: string | null;
  pickup_time: string | null;
  remarks: string | null;
  completed_at: string | null;
  item_count: number;
  assigned_staff: { id: number; name: string } | null;
  created_at: string | null;
  updated_at: string | null;
};

export type AdminPickupDetails = AdminPickupRequest & {
  allowed_statuses: string[];
  order: {
    id: number;
    reference: string;
    status: string;
    fulfillment_method: string;
    subtotal: number;
    delivery_fee: number;
    total_amount: number;
    items: Array<{
      product_id: number;
      part_number: string | null;
      name: string;
      unit_price: number;
      quantity: number;
      line_total: number;
    }>;
  } | null;
};

export type AdminPickupSummary = {
  total: number;
  active: number;
  pending: number;
  preparing: number;
  ready_for_pickup: number;
  completed: number;
  cancelled: number;
  completed_today: number;
};

export type AdminPickupListResponse = {
  summary: AdminPickupSummary;
  pickup_requests: AdminPickupRequest[];
  branch_summary: Array<{
    id: number;
    name: string;
    total: number;
    active: number;
    completed: number;
  }>;
  filters: {
    branches: Array<{ id: number; name: string }>;
    staff: Array<{ id: number; name: string }>;
  };
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type AdminPickupDetailsResponse = {
  pickup_request: AdminPickupDetails;
};
