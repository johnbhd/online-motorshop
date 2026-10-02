export type StaffPaymentCustomer = {
  id: number;
  full_name: string;
  contact_number: string | null;
  email: string | null;
};

export type StaffPaymentBranch = {
  id: number;
  name: string;
  address: string | null;
  contact_number: string | null;
};

export type StaffPayment = {
  id: number;
  order_reference: string | null;
  order_status: string | null;
  order_total: number | null;
  customer: StaffPaymentCustomer | null;
  branch: StaffPaymentBranch | null;
  amount: number;
  method: string;
  reference: string | null;
  proof_image_url: string | null;
  status: string;
  created_at: string | null;
  verified_at: string | null;
  verified_by: {
    id: number;
    name: string;
  } | null;
};

export type StaffPaymentOrderItem = {
  product_id: number;
  name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type StaffPaymentDetails = StaffPayment & {
  allowed_statuses: string[];
  order: {
    id: number;
    reference: string;
    status: string;
    fulfillment_method: string;
    subtotal: number;
    delivery_fee: number;
    total_amount: number;
    items: StaffPaymentOrderItem[];
  } | null;
};

export type StaffPaymentsSummary = {
  total: number;
  unpaid: number;
  waiting_for_payment: number;
  waiting_for_verification: number;
  paid: number;
  failed: number;
  refunded: number;
  cancelled: number;
};

export type StaffPaymentsMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type StaffPaymentsResponse = {
  summary: StaffPaymentsSummary;
  payments: StaffPayment[];
  meta: StaffPaymentsMeta;
};

export type StaffPaymentDetailsResponse = {
  payment: StaffPaymentDetails;
};

export type StaffPaymentStatusResponse = {
  message: string;
  payment: StaffPaymentDetails;
};
