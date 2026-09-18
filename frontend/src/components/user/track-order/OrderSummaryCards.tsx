import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faCreditCard,
  faLocationDot,
  faStore,
} from "@fortawesome/free-solid-svg-icons";
import type { TrackOrderData } from "./trackOrderTypes";

type OrderSummaryCardsProps = {
  order: TrackOrderData;
};

export default function OrderSummaryCards({ order }: OrderSummaryCardsProps) {
  const cards = [
    {
      label: "Fulfillment Method",
      value: order.fulfillmentMethod,
      icon: faStore,
    },
    {
      label: "Pickup Branch",
      value: order.branchName,
      icon: faLocationDot,
    },
    {
      label: "Payment Status",
      value: order.paymentStatus,
      icon: faCreditCard,
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
        <article className="track-order-summary-card">
          <span className="track-order-summary-card-icon" aria-hidden="true">
            <FontAwesomeIcon icon={faCalendarDays} />
          </span>
          <div>
            <span>Order Request Date</span>
            <strong>
              {order.requestDate}
              <small>{order.requestTime}</small>
            </strong>
          </div>
        </article>
      </div>
    </section>
  );
}
