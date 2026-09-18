import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faCreditCard,
  faLocationDot,
  faStore,
  faTruck,
} from "@fortawesome/free-solid-svg-icons";
import type { DemoOrder } from "@/lib/orders/orderTypes";
import { formatOrderTimestamp } from "../checkout/checkoutUtils";

type OrderSummaryCardsProps = {
  order: DemoOrder;
};

export default function OrderSummaryCards({ order }: OrderSummaryCardsProps) {
  const isPickup = order.fulfillment.method === "pickup";
  const fulfillmentValue = order.fulfillment.method === "pickup"
    ? order.fulfillment.branch.name
    : `${order.fulfillment.delivery.address}, ${order.fulfillment.delivery.barangay}, ${order.fulfillment.delivery.city}`;
  const cards = [
    {
      label: "Fulfillment Method",
      value: isPickup ? "Store Pickup" : "Lalamove Delivery",
      icon: isPickup ? faStore : faTruck,
    },
    {
      label: isPickup ? "Pickup Branch" : "Delivery Address",
      value: fulfillmentValue,
      icon: faLocationDot,
    },
    {
      label: "Payment Status",
      value: order.paymentStatus,
      icon: faCreditCard,
    },
    {
      label: "Order Request Date",
      value: formatOrderTimestamp(order.createdAt),
      icon: faCalendarDays,
    },
  ];

  return (
    <section aria-labelledby="track-order-summary-cards-title">
      <h2
        id="track-order-summary-cards-title"
        className="track-order-visually-hidden"
      >
        Order request details
      </h2>
      <div className="track-order-summary-cards">
        {cards.map((card) => (
          <article className="track-order-summary-card" key={card.label}>
            <span className="track-order-summary-card-icon" aria-hidden="true">
              <FontAwesomeIcon icon={card.icon} />
            </span>
            <div>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
