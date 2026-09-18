import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import type { DemoOrder } from "@/lib/orders/orderTypes";
import { formatOrderTimestamp } from "../checkout/checkoutUtils";

type OrderRequestSummaryProps = {
  order: DemoOrder;
};

export default function OrderRequestSummary({ order }: OrderRequestSummaryProps) {
  const fulfillmentLabel = order.fulfillment.method === "pickup"
    ? "Store Pickup"
    : "Lalamove Delivery";
  const fulfillmentValue = order.fulfillment.method === "pickup"
    ? order.fulfillment.branch.name
    : `${order.fulfillment.delivery.address}, ${order.fulfillment.delivery.barangay}, ${order.fulfillment.delivery.city}`;
  const fulfillmentFieldLabel = order.fulfillment.method === "pickup"
    ? "Branch"
    : "Delivery Address";

  return (
    <section
      className="track-order-card track-order-request-summary"
      aria-labelledby="track-order-summary-title"
    >
      <div className="track-order-section-heading">
        <div>
          <p className="track-order-section-eyebrow">REQUEST DETAILS</p>
          <h2 id="track-order-summary-title">Order Request Summary</h2>
        </div>
        <span className="track-order-status-badge">
          <FontAwesomeIcon icon={faCircleCheck} aria-hidden="true" />
          <span>{order.status}</span>
        </span>
      </div>
      <div className="track-order-request-details">
        <div>
          <span>Reference Number</span>
          <strong>{order.reference}</strong>
        </div>
        <div>
          <span>Submitted</span>
          <strong>{formatOrderTimestamp(order.createdAt)}</strong>
        </div>
        <div>
          <span>Fulfillment</span>
          <strong>{fulfillmentLabel}</strong>
        </div>
        <div>
          <span>{fulfillmentFieldLabel}</span>
          <strong>{fulfillmentValue}</strong>
        </div>
      </div>
    </section>
  );
}
