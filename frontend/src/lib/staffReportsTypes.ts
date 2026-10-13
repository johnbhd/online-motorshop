export type StaffReportsResponse = {
  filters: {
    from: string;
    to: string;
    fulfillment: string | null;
    order_status: string | null;
    payment_status: string | null;
    branch: {
      id: number;
      name: string;
    };
  };
  summary: {
    order_requests: number;
    completed_orders: number;
    in_progress_orders: number;
    cancelled_or_rejected_orders: number;
    completed_sales_value: number;
    verified_payments: number;
    payment_attention: number;
    pickup_orders: number;
    delivery_orders: number;
  };
  order_trend: Array<{
    key: string;
    label: string;
    orders: number;
    completed_sales: number;
  }>;
  order_statuses: Array<{
    key: string;
    label: string;
    value: number;
    color: string;
  }>;
  fulfillment: Array<{
    key: string;
    label: string;
    orders: number;
    completed_orders: number;
    percentage: number;
  }>;
  payments: {
    methods: Array<{ key: string; label: string; value: number }>;
    statuses: Array<{ key: string; label: string; value: number }>;
    verified_amount: number;
  };
  customers: {
    total: number;
    registered: number;
    guests: number;
    repeat_customers: number;
  };
  top_products: Array<{
    product_id: number;
    name: string;
    part_number: string | null;
    units_sold: number;
    orders: number;
    revenue: number;
  }>;
  orders: Array<{
    id: number;
    reference: string;
    customer: {
      id: number;
      full_name: string;
      contact_number: string | null;
      email: string | null;
    } | null;
    status: string;
    display_status: string;
    payment_status: string;
    fulfillment_method: string;
    fulfillment_status: string | null;
    branch: { id: number; name: string } | null;
    item_count: number;
    line_item_count: number;
    total_amount: number;
    created_at: string | null;
    updated_at: string | null;
  }>;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  recent_completed_orders: Array<{
    reference: string;
    fulfillment: string;
    total_amount: number;
    created_at: string | null;
  }>;
};
