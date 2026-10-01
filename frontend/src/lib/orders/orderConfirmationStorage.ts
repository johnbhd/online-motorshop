import type { OrderConfirmationData } from "./orderRequestTypes";

export const ORDER_CONFIRMATION_STORAGE_KEY = "ald_order_confirmation";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseOrderConfirmation(value: unknown): OrderConfirmationData | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "number" ||
    typeof value.reference !== "string" ||
    typeof value.status !== "string" ||
    typeof value.payment_status !== "string" ||
    (value.fulfillment_method !== "pickup" &&
      value.fulfillment_method !== "delivery") ||
    !Array.isArray(value.items) ||
    !isFiniteNumber(value.subtotal) ||
    !isFiniteNumber(value.delivery_fee) ||
    !isFiniteNumber(value.estimated_total) ||
    (value.customer_notes !== null &&
      typeof value.customer_notes !== "string") ||
    (value.created_at !== null && typeof value.created_at !== "string")
  ) {
    return null;
  }

  return value as unknown as OrderConfirmationData;
}

export function saveOrderConfirmation(order: OrderConfirmationData): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(
      ORDER_CONFIRMATION_STORAGE_KEY,
      JSON.stringify(order),
    );
    return true;
  } catch {
    return false;
  }
}

export function getOrderConfirmation(
  reference: string,
): OrderConfirmationData | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(
      ORDER_CONFIRMATION_STORAGE_KEY,
    );

    if (!storedValue) {
      return null;
    }

    const order = parseOrderConfirmation(JSON.parse(storedValue) as unknown);

    if (!order || order.reference.trim().toUpperCase() !== reference.trim().toUpperCase()) {
      return null;
    }

    return order;
  } catch {
    return null;
  }
}
