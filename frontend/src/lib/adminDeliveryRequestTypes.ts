export type AdminDeliveryRequest = {
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
  delivery_address: string;
  delivery_fee: number;
  booking_reference: string | null;
  tracking_url: string | null;
  rider_name: string | null;
  rider_contact: string | null;
  delivery_status: string;
  remarks: string | null;
  delivered_at: string | null;
  item_count: number;
  assigned_staff: { id: number; name: string } | null;
  created_at: string | null;
  updated_at: string | null;
};

export type AdminDeliveryRequestDetails = AdminDeliveryRequest & {
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

export type AdminDeliveryRequestSummary = {
  total: number;
  active: number;
  waiting_for_booking: number;
  booked: number;
  picked_up: number;
  in_transit: number;
  delivered: number;
  failed: number;
  cancelled: number;
  delivered_today: number;
};

export type AdminDeliveryRequestListResponse = {
  summary: AdminDeliveryRequestSummary;
  delivery_requests: AdminDeliveryRequest[];
  branch_summary: Array<{
    id: number;
    name: string;
    total: number;
    active: number;
    delivered: number;
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

export type AdminDeliveryRequestDetailsResponse = {
  delivery_request: AdminDeliveryRequestDetails;
};
