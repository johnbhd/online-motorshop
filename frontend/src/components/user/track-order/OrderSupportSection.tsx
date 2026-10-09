"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMessage,
  faStore,
  faTruck,
} from "@fortawesome/free-solid-svg-icons";
import type { OrderViewModel } from "@/lib/orders/orderTypes";
import { OPEN_STAFF_CHAT_EVENT } from "../chatbot/chatbotEvents";
import OrderPaymentSection from "../orders/OrderPaymentSection";

type OrderSupportSectionProps = {
  order: OrderViewModel;
  paymentToken?: string | null;
  onOrderUpdated?: (order: OrderViewModel) => void;
};

export default function OrderSupportSection({
  order,
  paymentToken,
  onOrderUpdated,
}: OrderSupportSectionProps) {
  const isPickup = order.fulfillment.method === "pickup";
  const fulfillmentMethod = isPickup ? "Store Pickup" : "Delivery";
  const fulfillmentInformation = isPickup
    ? "Please wait for ALD staff to confirm that the request is ready before visiting the branch."
    : "ALD staff will confirm the delivery details, fee, and arrangement before dispatch.";
  const fulfillmentDetailLabel = isPickup
    ? "Pickup branch"
    : "Delivery address";
  const fulfillmentDetail = order.fulfillment.method === "pickup"
    ? order.fulfillment.branch?.name ?? "Branch unavailable"
    : order.fulfillment.delivery?.address ?? "Delivery address unavailable";
  const handleTalkToStaff = () => {
    window.dispatchEvent(new Event(OPEN_STAFF_CHAT_EVENT));
  };

  return (
    <aside className="track-order-support-column">
      <section
        className="track-order-card track-order-support-card"
        aria-labelledby="track-order-fulfillment-title"
      >
        <span className="track-order-support-icon" aria-hidden="true">
          <FontAwesomeIcon icon={isPickup ? faStore : faTruck} />
        </span>
        <p className="track-order-section-eyebrow">FULFILLMENT</p>
        <h2 id="track-order-fulfillment-title">Fulfillment Information</h2>
        <strong>{fulfillmentMethod}</strong>
        <p>{fulfillmentInformation}</p>
        <div className="track-order-support-detail">
          <span>{fulfillmentDetailLabel}</span>
          <strong>{fulfillmentDetail}</strong>
        </div>
      </section>
      <OrderPaymentSection
        order={order}
        paymentToken={paymentToken}
        onOrderUpdated={onOrderUpdated}
      />
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
          <button
            className="track-order-help-button"
            type="button"
            onClick={handleTalkToStaff}
          >
            <FontAwesomeIcon icon={faMessage} aria-hidden="true" />
            <span>Talk to ALD Staff</span>
          </button>
        </div>
      </section>
    </aside>
  );
}
