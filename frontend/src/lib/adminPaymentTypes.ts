export type AdminPaymentCustomer = {
  id: number;
  full_name: string;
  contact_number: string | null;
  email: string | null;
};

export type AdminPaymentBranch = {
  id: number;
  name: string;
  address: string | null;
  contact_number: string | null;
};

export type AdminPayment = {
  id: number;
  order_reference: string | null;
  order_status: string | null;
  order_total: number | null;
  customer: AdminPaymentCustomer | null;
  branch: AdminPaymentBranch | null;
  amount: number;
  method: string;
  reference: string | null;
  proof_image_url: string | null;
  status: string;
  created_at: string | null;
  verified_at: string | null;
  verified_by: { id: number; name: string } | null;
};

export type AdminPaymentDetails = AdminPayment & {
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
      name: string;
      unit_price: number;
      quantity: number;
      line_total: number;
    }>;
  } | null;
};

export type AdminPaymentSummary = {
  total: number;
  unpaid: number;
  waiting_for_payment: number;
  waiting_for_verification: number;
  paid: number;
  failed: number;
  refunded: number;
  cancelled: number;
};

export type AdminPaymentListResponse = {
  summary: AdminPaymentSummary;
  payments: AdminPayment[];
  filters: {
    branches: Array<{ id: number; name: string }>;
    methods: string[];
    statuses: string[];
  };
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type AdminPaymentDetailsResponse = { payment: AdminPaymentDetails };

export type AdminPaymentStatusResponse = {
  message: string;
  payment: AdminPaymentDetails;
};
