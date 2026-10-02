export type StaffDeliveryCustomer = {
  id: number;
  full_name: string;
  contact_number: string | null;
  email: string | null;
  address: string | null;
};

export type StaffDeliveryBranch = {
  id: number;
  name: string;
  address: string | null;
  contact_number: string | null;
};

export type StaffDeliveryPayment = {
  id: number;
  method: string;
  amount: number | null;
  reference: string | null;
  status: string;
  verified_at: string | null;
};

export type StaffDeliveryRequest = {
  id: number;
  order_reference: string | null;
  order_status: string | null;
  customer: StaffDeliveryCustomer | null;
  branch: StaffDeliveryBranch | null;
  amount: number | null;
  payment: StaffDeliveryPayment | null;
  delivery_address: string | null;
  delivery_fee: number | null;
  booking_reference: string | null;
  tracking_url: string | null;
  rider_name: string | null;
  rider_contact: string | null;
  delivery_status: string;
  remarks: string | null;
  delivered_at: string | null;
  item_count: number;
  assigned_staff: {
    id: number;
    name: string;
  } | null;
  created_at: string | null;
  updated_at: string | null;
};

export type StaffDeliveryOrderItem = {
  product_id: number;
  part_number: string | null;
  name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type StaffDeliveryDetails = StaffDeliveryRequest & {
  allowed_statuses: string[];
  order: {
    id: number;
    reference: string;
    status: string;
    fulfillment_method: string;
    subtotal: number;
    delivery_fee: number;
    total_amount: number;
    items: StaffDeliveryOrderItem[];
  } | null;
};

export type StaffDeliveriesSummary = {
  total: number;
  active: number;
  waiting_for_booking: number;
  booked: number;
  picked_up: number;
  in_transit: number;
  delivered: number;
  failed: number;
  cancelled: number;
};

export type StaffDeliveriesMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type StaffDeliveriesResponse = {
  summary: StaffDeliveriesSummary;
  delivery_requests: StaffDeliveryRequest[];
  meta: StaffDeliveriesMeta;
};

export type StaffDeliveryDetailsResponse = {
  delivery_request: StaffDeliveryDetails;
};

export type StaffDeliveryStatusResponse = {
  message: string;
  delivery_request: StaffDeliveryDetails;
};
