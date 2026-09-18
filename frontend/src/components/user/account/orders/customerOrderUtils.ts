import { formatCartCurrency } from "../../cart/cartData";
import type { DemoOrder, OrderStatus } from "@/lib/orders/orderTypes";

export type CustomerOrderTab = "active" | "history";

export const ORDERS_PER_PAGE = 10;

const HISTORICAL_ORDER_STATUSES = new Set<OrderStatus>([
  "Completed",
  "Rejected",
  "Cancelled",
]);

export function getOrderLifecycleGroup(
  status: OrderStatus,
): CustomerOrderTab {
  return HISTORICAL_ORDER_STATUSES.has(status) ? "history" : "active";
}

export function isActiveOrder(order: DemoOrder): boolean {
  return getOrderLifecycleGroup(order.status) === "active";
}

export function isHistoricalOrder(order: DemoOrder): boolean {
  return getOrderLifecycleGroup(order.status) === "history";
}

export function sortOrdersNewestFirst(orders: DemoOrder[]): DemoOrder[] {
  return [...orders].sort((leftOrder, rightOrder) => {
    const leftTime = new Date(leftOrder.createdAt).getTime();
    const rightTime = new Date(rightOrder.createdAt).getTime();
    const leftHasValidDate = Number.isFinite(leftTime);
    const rightHasValidDate = Number.isFinite(rightTime);

    if (leftHasValidDate && rightHasValidDate && leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    if (leftHasValidDate !== rightHasValidDate) {
      return rightHasValidDate ? 1 : -1;
    }

    return rightOrder.reference.localeCompare(leftOrder.reference);
  });
}

export function getOrderItemCount(order: DemoOrder): number {
  return order.items.reduce((total, item) => {
    return total + item.quantity;
  }, 0);
}

export function getOrderItemLabel(order: DemoOrder): string {
  const count = getOrderItemCount(order);
  return `${count} ${count === 1 ? "item" : "items"}`;
}

export function getOrderFulfillmentSummary(order: DemoOrder): {
  label: string;
  detail: string;
} {
  if (order.fulfillment.method === "pickup") {
    return {
      label: "Store Pickup",
      detail: order.fulfillment.branch.name,
    };
  }

  return {
    label: "Lalamove Delivery",
    detail: order.fulfillment.delivery.city,
  };
}

export function getOrderAmountDisplay(order: DemoOrder): string {
  const amount =
    typeof order.finalAmount === "number"
      ? order.finalAmount
      : order.estimatedSubtotal;

  if (typeof amount === "number" && Number.isFinite(amount) && amount > 0) {
    return formatCartCurrency(amount);
  }

  return "Pending confirmation";
}
