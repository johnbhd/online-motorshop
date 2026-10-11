export type OrderRequestItemInput = {
  part_number: string;
  quantity: number;
};

export type PaymentMethod = "pay_at_pickup" | "online_payment";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pay_at_pickup: "Pay at Pickup",
  online_payment: "GCash / Online Payment",
};

export function getPaymentMethodLabel(
  value: string | null | undefined,
): string {
  if (!value) {
    return "Payment method unavailable";
  }

  const label = PAYMENT_METHOD_LABELS[value as PaymentMethod];

  if (label) {
    return label;
  }

  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export type OrderRequestPayload = {
  customer: {
    name: string;
    email: string;
    contact_number: string;
  };
  items: OrderRequestItemInput[];
  payment_method: PaymentMethod;
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
          city_municipality_code?: string;
          barangay_code?: string;
          latitude?: number | null;
          longitude?: number | null;
          contact_person: string;
          contact_number?: string;
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
  payment?: {
    id: number;
    method: string;
    amount: number;
    reference: string | null;
    status: string;
    verified_at: string | null;
  } | null;
  pickup?: {
    branch_id: number | null;
    status: string | null;
  };
  delivery?: {
    branch_id: number | null;
    address: string | null;
    complete_address?: string | null;
    city_municipality?: string | null;
    city_municipality_code?: string | null;
    barangay?: string | null;
    barangay_code?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    contact_person?: string | null;
    contact_number?: string | null;
    notes?: string | null;
    vehicle_plate?: string | null;
    status: string | null;
    remarks: string | null;
  };
};

export type OrderRequestSuccessResponse = {
  message: string;
  order: OrderConfirmationData;
};

export type LaravelValidationErrors = Record<string, string[]>;
