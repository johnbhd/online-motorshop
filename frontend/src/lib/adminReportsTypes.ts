export type AdminReportBranch = { id: number; name: string };

export type AdminReportsResponse = {
  filters: {
    from: string;
    to: string;
    branch_id: number | null;
    branches: AdminReportBranch[];
  };
  overview: {
    total_orders: number;
    successful_orders: number;
    revenue_collected: number;
    paid_orders: number;
    average_order_value: number;
  };
  order_trend: Array<{ key: string; label: string; orders: number; revenue: number }>;
  order_statuses: Array<{ key: string; label: string; value: number; color: string }>;
  fulfillment: Array<{
    key: string;
    label: string;
    orders: number;
    successful_orders: number;
    percentage: number;
  }>;
  pickup: Array<{ key: string; label: string; value: number }>;
  delivery: Array<{ key: string; label: string; value: number }>;
  payments: {
    methods: Array<{ key: string; label: string; value: number }>;
    statuses: Array<{ key: string; label: string; value: number }>;
  };
  branches: Array<{
    branch_id: number;
    branch: string;
    orders: number;
    successful_orders: number;
    revenue: number;
    average_order_value: number;
    pickup_orders: number;
    delivery_orders: number;
  }>;
  top_products: Array<{
    product_id: number;
    name: string;
    part_number: string | null;
    units_sold: number;
    orders: number;
    revenue: number;
  }>;
  categories: Array<{ label: string; units_sold: number; revenue: number }>;
  brands: Array<{ label: string; units_sold: number; revenue: number }>;
  customers: {
    total: number;
    registered: number;
    guests: number;
    with_orders: number;
    repeat_customers: number;
    new_registered: number;
  };
  reviews: {
    total: number;
    average_rating: number;
    statuses: Array<{ key: string; label: string; value: number }>;
    ratings: Array<{ rating: number; value: number }>;
  };
  recent_successful_orders: Array<{
    reference: string;
    branch: string | null;
    fulfillment: string;
    total_amount: number;
    created_at: string | null;
  }>;
};
