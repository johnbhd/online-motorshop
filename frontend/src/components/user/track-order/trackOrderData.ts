import type { DemoOrder, OrderStatus } from "@/lib/orders/orderTypes";
import type { TrackOrderProgressStep } from "./trackOrderTypes";

const pickupStages = [
  "Order Request Submitted",
  "Under Review",
  "Confirmed",
  "Preparing Order",
  "Ready for Pickup",
  "Completed",
] as const;

const deliveryStages = [
  "Order Request Submitted",
  "Under Review",
  "Confirmed",
  "Preparing Order",
  "Booked for Delivery",
  "Picked Up by Rider",
  "Completed",
] as const;

const statusDescriptions: Record<OrderStatus, string> = {
  Pending: "Your order request has been received and is waiting for ALD staff review.",
  "Under Review": "ALD staff is reviewing availability and compatibility for your request.",
  Confirmed: "ALD staff has confirmed the request and will share the next fulfillment details.",
  "Waiting for Payment": "Payment instructions are pending confirmation from ALD staff.",
  "Payment Verification": "ALD staff is verifying the submitted payment information.",
  "Preparing Order": "Your confirmed items are being prepared for fulfillment.",
  "Ready for Pickup": "Your order is ready for pickup at the submitted branch.",
  "Booked for Delivery": "The delivery request has been arranged for the submitted address.",
  "Picked Up by Rider": "The delivery has been picked up by the assigned rider.",
  Completed: "This order request has reached its recorded completed state.",
  Rejected: "ALD staff could not approve this order request. Please contact us if you need help.",
  Cancelled: "This order request was cancelled and will not continue through fulfillment.",
};

export function getOrderStatusPresentation(status: OrderStatus) {
  return {
    label: status,
    description: statusDescriptions[status],
  };
}

export function getOrderProgressSteps(
  order: DemoOrder,
): TrackOrderProgressStep[] {
  const stages = order.fulfillment.method === "pickup"
    ? pickupStages
    : deliveryStages;

  if (order.status === "Rejected" || order.status === "Cancelled") {
    return stages.map((label, index) => ({
      label,
      state: index === 0 ? "complete" : "pending",
    }));
  }

  if (order.status === "Completed") {
    return stages.map((label) => ({
      label,
      state: "complete",
    }));
  }

  const currentIndex = getCurrentStageIndex(order.status, order.fulfillment.method);

  return stages.map((label, index) => ({
    label,
    state:
      index < currentIndex
        ? "complete"
        : index === currentIndex
          ? "current"
          : "pending",
  }));
}

export function getOrderProgressCaption(order: DemoOrder): string {
  if (order.status === "Rejected" || order.status === "Cancelled") {
    return order.status;
  }

  const steps = getOrderProgressSteps(order);
  const completedStages = steps.filter((step) => step.state === "complete").length;
  const currentStage = steps.some((step) => step.state === "current")
    ? 1
    : 0;

  return `${completedStages + currentStage} of ${steps.length} stages`;
}

function getCurrentStageIndex(
  status: OrderStatus,
  method: "pickup" | "delivery",
): number {
  if (status === "Under Review") {
    return 1;
  }

  if (
    status === "Confirmed" ||
    status === "Waiting for Payment" ||
    status === "Payment Verification"
  ) {
    return 2;
  }

  if (status === "Preparing Order") {
    return 3;
  }

  if (
    status === "Ready for Pickup" ||
    status === "Booked for Delivery"
  ) {
    return 4;
  }

  if (status === "Picked Up by Rider") {
    return method === "delivery" ? 5 : 4;
  }

  return 0;
}
