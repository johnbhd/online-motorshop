import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCreditCard,
  faMessage,
  faStore,
} from "@fortawesome/free-solid-svg-icons";
import type { TrackOrderData } from "./trackOrderTypes";

type OrderSupportSectionProps = {
  order: TrackOrderData;
};

export default function OrderSupportSection({
  order,
}: OrderSupportSectionProps) {
  return (
    <aside className="track-order-support-column">
      <section
        className="track-order-card track-order-support-card"
        aria-labelledby="track-order-fulfillment-title"
      >
        <span className="track-order-support-icon" aria-hidden="true">
          <FontAwesomeIcon icon={faStore} />
        </span>
        <p className="track-order-section-eyebrow">FULFILLMENT</p>
        <h2 id="track-order-fulfillment-title">Fulfillment Information</h2>
        <strong>{order.fulfillmentMethod}</strong>
        <p>{order.fulfillmentInformation}</p>
        <div className="track-order-support-detail">
          <span>Pickup branch</span>
          <strong>{order.branchName}</strong>
        </div>
      </section>
      <section
        className="track-order-card track-order-support-card"
        aria-labelledby="track-order-payment-title"
      >
        <span className="track-order-support-icon" aria-hidden="true">
          <FontAwesomeIcon icon={faCreditCard} />
        </span>
        <p className="track-order-section-eyebrow">PAYMENT</p>
        <h2 id="track-order-payment-title">Payment Status</h2>
        <strong>{order.paymentStatus}</strong>
        <p>{order.paymentInformation}</p>
      </section>
      <section
        className="track-order-help-card"
        aria-labelledby="track-order-help-title"
      >
        <span className="track-order-help-icon" aria-hidden="true">
          <FontAwesomeIcon icon={faMessage} />
        </span>
        <h2 id="track-order-help-title">Need help with your order?</h2>
        <p>
          Contact ALD Motorshop if you need assistance with your order request.
        </p>
        <div className="track-order-help-actions">
          <Link className="track-order-help-link" href="/contact">
            Contact Us
          </Link>
          <button className="track-order-help-button" type="button">
            <FontAwesomeIcon icon={faMessage} aria-hidden="true" />
            <span>Talk to ALD Staff</span>
          </button>
        </div>
      </section>
    </aside>
  );
}
