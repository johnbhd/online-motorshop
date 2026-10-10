import type {
  OrderApiBranch,
  OrderApiDetails,
  OrderApiPayment,
  OrderApiSummary,
} from "./orderApi";
import type {
  CustomerOrderBranch,
  CustomerOrderSummary,
  OrderViewDelivery,
  OrderViewFulfillment,
  OrderViewItem,
  OrderViewModel,
  OrderViewPayment,
  OrderViewPickup,
} from "./orderTypes";
import { getPaymentMethodLabel } from "./orderRequestTypes";

export function toCustomerOrderSummary(
  order: OrderApiSummary,
): CustomerOrderSummary {
  const displayStatus = toStatusLabel(order.display_status ?? order.status);

  return {
    id: order.id,
    reference: order.reference,
    status: displayStatus,
    orderStatus: toStatusLabel(order.status),
    displayStatus,
    fulfillmentStatus: order.fulfillment_status ?? null,
    paymentStatus: toStatusLabel(order.payment_status),
    payment: toPayment(order.payment),
    fulfillmentMethod: order.fulfillment_method,
    branch: toBranch(order.branch),
    itemCount: order.item_count,
    lineItemCount: order.line_item_count,
    subtotal: order.subtotal,
    deliveryFee: order.delivery_fee,
    estimatedTotal: order.estimated_total,
    totalAmount: order.total_amount,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  };
}

export function toOrderViewModel(order: OrderApiDetails): OrderViewModel {
  const fulfillmentMethod = order.fulfillment_method.toLowerCase();
  const displayStatus = toStatusLabel(order.display_status ?? order.status);
  const items = order.items.map(toOrderItem);
  const fulfillment: OrderViewFulfillment =
    fulfillmentMethod === "delivery"
      ? {
          method: "delivery",
          branch: toBranch(order.branch),
          delivery: toDelivery(order.delivery),
        }
      : {
          method: "pickup",
          branch: toBranch(order.branch),
          pickup: toPickup(order.pickup),
        };

  return {
    id: order.id,
    reference: order.reference,
    customer: order.customer
      ? {
          fullName: order.customer.full_name,
          contactNumber: order.customer.contact_number,
          email: order.customer.email,
          address: order.customer.address,
        }
      : null,
    items,
    fulfillment,
    orderNotes: order.customer_notes,
    subtotal: order.subtotal,
    deliveryFee: order.delivery_fee,
    estimatedTotal: order.estimated_total,
    totalAmount: order.total_amount,
    finalAmount: null,
    totalQuantity: items.reduce((total, item) => total + item.quantity, 0),
    status: displayStatus,
    orderStatus: toStatusLabel(order.status),
    displayStatus,
    fulfillmentStatus: order.fulfillment_status ?? null,
    paymentStatus: toStatusLabel(order.payment_status),
    payment: toPayment(order.payment),
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    activities: [],
  };
}

export function toStatusLabel(value: string): string {
  const normalizedValue = value.trim().toLowerCase().replace(/[-\s]+/g, "_");
  const knownLabels: Record<string, string> = {
    pending: "Pending",
    under_review: "Under Review",
    confirmed: "Confirmed",
    preparing: "Preparing",
    waiting_for_payment: "Waiting for Payment",
    payment_verification: "Payment Verification",
    waiting_for_verification: "Waiting for Verification",
    preparing_order: "Preparing Order",
    ready_for_pickup: "Ready for Pickup",
    booked_for_delivery: "Booked for Delivery",
    picked_up_by_rider: "Picked Up by Rider",
    waiting_for_booking: "Waiting for Booking",
    completed: "Completed",
    rejected: "Rejected",
    cancelled: "Cancelled",
    unpaid: "Unpaid",
    paid: "Paid",
    failed: "Failed",
    refunded: "Refunded",
  };

  return (
    knownLabels[normalizedValue] ??
    normalizedValue
      .split("_")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

function toBranch(branch: OrderApiBranch | null): CustomerOrderBranch | null {
  if (!branch) {
    return null;
  }

  return {
    id: branch.id,
    name: branch.name,
    address: branch.address,
    contactNumber: branch.contact_number,
  };
}

function toOrderItem(item: OrderApiDetails["items"][number]): OrderViewItem {
  return {
    product: {
      id: String(item.product_id),
      partNumber: item.part_number,
      name: item.name,
      brand: null,
      image: item.image,
      alt: `${item.name} product image`,
    },
    unitPrice: item.unit_price,
    lineTotal: item.line_total,
    quantity: item.quantity,
  };
}

function toPickup(
  pickup: OrderApiDetails["pickup"],
): OrderViewPickup | null {
  if (!pickup) {
    return null;
  }

  return {
    branchId: pickup.branch_id,
    status: toStatusLabel(pickup.status),
    pickupDate: pickup.pickup_date,
    pickupTime: pickup.pickup_time,
    remarks: pickup.remarks,
    completedAt: pickup.completed_at,
  };
}

function toDelivery(
  delivery: OrderApiDetails["delivery"],
): OrderViewDelivery | null {
  if (!delivery) {
    return null;
  }

  return {
    branchId: delivery.branch_id,
    address: delivery.address,
    fee: delivery.fee,
    status: toStatusLabel(delivery.status),
    bookingReference: delivery.booking_reference,
    trackingUrl: delivery.tracking_url,
    riderName: delivery.rider_name,
    riderContact: delivery.rider_contact,
    remarks: delivery.remarks,
    deliveredAt: delivery.delivered_at,
  };
}

function toPayment(payment: OrderApiPayment | null): OrderViewPayment | null {
  if (!payment) {
    return null;
  }

  return {
    id: payment.id,
    method: getPaymentMethodLabel(payment.method),
    amount: payment.amount,
    reference: payment.reference,
    proofImageUrl: payment.proof_image_url,
    status: toStatusLabel(payment.status),
    verifiedAt: payment.verified_at,
  };
}
