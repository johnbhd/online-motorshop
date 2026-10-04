import { formatCartCurrency, isUsablePrice } from "../../cart/cartData";
import type { CustomerOrderSummary } from "@/lib/orders/orderTypes";

export type CustomerOrderTab = "active" | "history";

export const ORDERS_PER_PAGE = 10;

export function getOrderItemCount(order: CustomerOrderSummary): number {
  return order.itemCount;
}

export function getOrderItemLabel(order: CustomerOrderSummary): string {
  const count = getOrderItemCount(order);
  return `${count} ${count === 1 ? "item" : "items"}`;
}

export function getOrderFulfillmentSummary(order: CustomerOrderSummary): {
  label: string;
  detail: string;
} {
  if (order.fulfillmentMethod === "pickup") {
    return {
      label: "Store Pickup",
      detail: order.branch?.name ?? "Branch unavailable",
    };
  }

  return {
    label: "Delivery",
    detail: order.branch?.name ?? "Delivery details pending",
  };
}

export function getOrderAmountDisplay(order: CustomerOrderSummary): string {
  const amount = isUsablePrice(order.totalAmount)
    ? order.totalAmount
    : order.estimatedTotal;

  return isUsablePrice(amount)
    ? formatCartCurrency(amount)
    : "Price unavailable";
}
