export type StaffPickupCustomer = {
  id: number;
  full_name: string;
  contact_number: string | null;
  email: string | null;
  address: string | null;
};

export type StaffPickupBranch = {
  id: number;
  name: string;
  address: string | null;
  contact_number: string | null;
};

export type StaffPickupPayment = {
  id: number;
  method: string;
  amount: number | null;
  reference: string | null;
  status: string;
  verified_at: string | null;
};

export type StaffPickupRequest = {
  id: number;
  order_reference: string | null;
  order_status: string | null;
  customer: StaffPickupCustomer | null;
  branch: StaffPickupBranch | null;
  amount: number | null;
  payment: StaffPickupPayment | null;
  pickup_status: string;
  pickup_date: string | null;
  pickup_time: string | null;
  remarks: string | null;
  completed_at: string | null;
  item_count: number;
  assigned_staff: {
    id: number;
    name: string;
  } | null;
  created_at: string | null;
  updated_at: string | null;
};

export type StaffPickupOrderItem = {
  product_id: number;
  part_number: string | null;
  name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type StaffPickupDetails = StaffPickupRequest & {
  allowed_statuses: string[];
  order: {
    id: number;
    reference: string;
    status: string;
    fulfillment_method: string;
    subtotal: number;
    delivery_fee: number;
    total_amount: number;
    items: StaffPickupOrderItem[];
  } | null;
};

export type StaffPickupsSummary = {
  total: number;
  active: number;
  pending: number;
  preparing: number;
  ready_for_pickup: number;
  completed: number;
  cancelled: number;
};

export type StaffPickupsMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type StaffPickupsResponse = {
  summary: StaffPickupsSummary;
  pickup_requests: StaffPickupRequest[];
  meta: StaffPickupsMeta;
};

export type StaffPickupDetailsResponse = {
  pickup_request: StaffPickupDetails;
};

export type StaffPickupStatusResponse = {
  message: string;
  pickup_request: StaffPickupDetails;
};
