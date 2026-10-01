export type OrderRequestItemInput = {
  part_number: string;
  quantity: number;
};

export type OrderRequestPayload = {
  customer: {
    name: string;
    email: string;
    contact_number: string;
  };
  items: OrderRequestItemInput[];
  fulfillment:
    | {
        method: "pickup";
        branch_id: number;
      }
    | {
        method: "delivery";
        branch_id: number;
        delivery: {
          address: string;
          barangay: string;
          city: string;
          contact_person: string;
          notes?: string;
        };
      };
  order_notes?: string;
};

export type OrderConfirmationData = {
  id: number;
  reference: string;
  status: string;
  payment_status: string;
  fulfillment_method: "pickup" | "delivery";
  branch: {
    id: number;
    name: string;
    address: string;
    contact_number: string;
  } | null;
  customer: {
    id: number;
    full_name: string;
    contact_number: string;
    email: string;
    address: string | null;
  } | null;
  items: Array<{
    product_id: number;
    part_number: string | null;
    name: string;
    unit_price: number;
    quantity: number;
    line_total: number;
  }>;
  subtotal: number;
  delivery_fee: number;
  estimated_total: number;
  customer_notes: string | null;
  created_at: string | null;
  pickup?: {
    branch_id: number | null;
    status: string | null;
  };
  delivery?: {
    branch_id: number | null;
    address: string | null;
    status: string | null;
    remarks: string | null;
  };
};

export type OrderRequestSuccessResponse = {
  message: string;
  order: OrderConfirmationData;
};

export type LaravelValidationErrors = Record<string, string[]>;
