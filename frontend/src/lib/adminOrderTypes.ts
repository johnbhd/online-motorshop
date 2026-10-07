export type AdminOrderPerson = {
  id: number;
  full_name?: string;
  name?: string;
  contact_number?: string | null;
  email?: string | null;
  branch_id?: number | null;
};

export type AdminOrderBranch = {
  id: number;
  name: string;
  address?: string | null;
  contact_number?: string | null;
};

export type AdminOrderPayment = {
  id: number;
  method: string;
  amount: number;
  reference: string | null;
  proof_image_url: string | null;
  status: string;
  verified_at: string | null;
} | null;

export type AdminOrderItem = {
  product_id: number | null;
  part_number: string | null;
  image: string | null;
  name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type AdminOrder = {
  id: number;
  reference: string;
  customer: AdminOrderPerson | null;
  status: string;
  payment_status: string;
  payment_method: string | null;
  fulfillment_method: "pickup" | "delivery" | string;
  fulfillment_status: string | null;
  branch: AdminOrderBranch | null;
  assigned_staff: { id: number; name: string; email: string; branch_id: number | null } | null;
  item_count: number;
  line_item_count: number;
  total_amount: number;
  created_at: string | null;
  updated_at: string | null;
};

export type AdminOrderDetail = AdminOrder & {
  items: AdminOrderItem[];
  subtotal: number;
  delivery_fee: number;
  estimated_total: number;
  customer_notes: string | null;
  staff_notes: string | null;
  payment: AdminOrderPayment;
  pickup: {
    branch_id: number;
    status: string;
    pickup_date: string | null;
    pickup_time: string | null;
    remarks: string | null;
    completed_at: string | null;
  } | null;
  delivery: {
    branch_id: number;
    address: string;
    fee: number;
    status: string;
    booking_reference: string | null;
    tracking_url: string | null;
    rider_name: string | null;
    rider_contact: string | null;
    remarks: string | null;
    delivered_at: string | null;
  } | null;
  allowed_statuses: string[];
};

export type AdminOrderStaffOption = {
  id: number;
  name: string;
  email?: string;
  branch_id: number | null;
};

export type AdminOrderListResponse = {
  summary: {
    total: number;
    pending: number;
    under_review: number;
    confirmed: number;
    completed: number;
    needs_review: number;
    status_counts: Record<string, number>;
  };
  orders: AdminOrder[];
  filters: {
    branches: Array<{ id: number; name: string }>;
    staff: AdminOrderStaffOption[];
  };
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type AdminOrderDetailResponse = {
  order: AdminOrderDetail;
  assignable_staff: AdminOrderStaffOption[];
};
