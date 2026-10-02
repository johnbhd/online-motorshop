import type { OrderViewModel } from "@/lib/orders/orderTypes";
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

const statusDescriptions: Record<string, string> = {
  pending: "Your order request has been received and is waiting for ALD staff review.",
  under_review: "ALD staff is reviewing availability and compatibility for your request.",
  confirmed: "ALD staff has confirmed the request and will share the next fulfillment details.",
  waiting_for_booking: "The delivery request is waiting for fulfillment arrangements.",
  waiting_for_payment: "Payment instructions are pending confirmation from ALD staff.",
  payment_verification: "ALD staff is verifying the submitted payment information.",
  preparing: "Your confirmed items are being prepared for fulfillment.",
  preparing_order: "Your confirmed items are being prepared for fulfillment.",
  ready_for_pickup: "Your order is ready for pickup at the submitted branch.",
  booked_for_delivery: "The delivery request has been arranged for the submitted address.",
  picked_up_by_rider: "The delivery has been picked up by the assigned rider.",
  completed: "This order request has reached its recorded completed state.",
  rejected: "ALD staff could not approve this order request. Please contact us if you need help.",
  cancelled: "This order request was cancelled and will not continue through fulfillment.",
};

export function getOrderStatusPresentation(status: string) {
  const normalizedStatus = normalizeStatus(status);

  return {
    label: status,
    description:
      statusDescriptions[normalizedStatus] ??
      "ALD staff will update this order request as fulfillment progresses.",
  };
}

export function getOrderProgressSteps(
  order: OrderViewModel,
): TrackOrderProgressStep[] {
  const stages = order.fulfillment.method === "pickup"
    ? pickupStages
    : deliveryStages;
  const normalizedStatus = normalizeStatus(order.status);

  if (normalizedStatus === "rejected" || normalizedStatus === "cancelled") {
    return stages.map((label, index) => ({
      label,
      state: index === 0 ? "complete" : "pending",
    }));
  }

  if (normalizedStatus === "completed") {
    return stages.map((label) => ({
      label,
      state: "complete",
    }));
  }

  const currentIndex = getCurrentStageIndex(
    normalizedStatus,
    order.fulfillment.method,
  );

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

export function getOrderProgressCaption(order: OrderViewModel): string {
  if (
    normalizeStatus(order.status) === "rejected" ||
    normalizeStatus(order.status) === "cancelled"
  ) {
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
  status: string,
  method: "pickup" | "delivery",
): number {
  if (status === "under_review") {
    return 1;
  }

  if (
    status === "confirmed" ||
    status === "waiting_for_booking" ||
    status === "waiting_for_payment" ||
    status === "payment_verification"
  ) {
    return 2;
  }

  if (status === "preparing" || status === "preparing_order") {
    return 3;
  }

  if (
    status === "ready_for_pickup" ||
    status === "booked_for_delivery"
  ) {
    return 4;
  }

  if (status === "picked_up_by_rider") {
    return method === "delivery" ? 5 : 4;
  }

  return 0;
}

function normalizeStatus(status: string): string {
  return status.trim().toLowerCase().replace(/[-\s]+/g, "_");
}
