"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faCheck,
  faCircleInfo,
  faFileLines,
  faStore,
  faTruck,
} from "@fortawesome/free-solid-svg-icons";
import type { DemoOrder } from "@/lib/orders/orderTypes";
import { formatCartCurrency } from "../cart/cartData";
import { formatOrderTimestamp, getDemoOrderByReference } from "./checkoutUtils";

type OrderConfirmationPageProps = {
  reference: string;
};

export default function OrderConfirmationPage({
  reference,
}: OrderConfirmationPageProps) {
  const [order, setOrder] = useState<DemoOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Browser storage is read after hydration to avoid server/client markup drift.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate the saved order request after the client mounts
    setOrder(getDemoOrderByReference(reference));
    setIsLoading(false);
  }, [reference]);

  if (isLoading) {
    return (
      <div className="order-confirmation-page">
        <section className="order-confirmation-loading" aria-live="polite">
          Loading order request…
        </section>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-confirmation-page">
        <section
          className="order-confirmation-missing"
          aria-labelledby="order-confirmation-missing-title"
        >
          <div className="order-confirmation-icon" aria-hidden="true">
            <FontAwesomeIcon icon={faFileLines} />
          </div>
          <h1 id="order-confirmation-missing-title">Order request not found</h1>
          <p>
            This browser does not have a saved order request with that reference.
          </p>
          <div className="order-confirmation-actions order-confirmation-actions--centered">
            <Link className="order-confirmation-primary-link" href="/track-order">
              Track Order
            </Link>
            <Link className="order-confirmation-secondary-link" href="/products">
              Browse Products
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const isPickup = order.fulfillment.method === "pickup";
  const fulfillmentLabel = isPickup ? "Store Pickup" : "Lalamove Delivery";
  const fulfillmentValue = order.fulfillment.method === "pickup"
    ? order.fulfillment.branch.name
    : `${order.fulfillment.delivery.address}, ${order.fulfillment.delivery.barangay}, ${order.fulfillment.delivery.city}`;
  const fulfillmentIcon = isPickup ? faStore : faTruck;

  return (
    <div className="order-confirmation-page">
      <section className="order-confirmation-header" aria-labelledby="order-confirmation-title">
        <div className="order-confirmation-shell">
          <nav className="order-confirmation-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Order Confirmation</span>
          </nav>
          <p className="order-confirmation-eyebrow">Request Saved</p>
          <h1 id="order-confirmation-title">Order Request Submitted</h1>
          <p>
            Your request is saved in this browser and is ready for ALD staff review.
          </p>
        </div>
      </section>

      <section
        className="order-confirmation-content order-confirmation-shell"
        aria-labelledby="order-confirmation-reference-title"
      >
        <div className="order-confirmation-success-icon" aria-hidden="true">
          <FontAwesomeIcon icon={faCheck} />
        </div>
        <div className="order-confirmation-card">
          <p className="order-confirmation-card-eyebrow">ALD Order Reference</p>
          <h2 id="order-confirmation-reference-title">{order.reference}</h2>
          <div className="order-confirmation-status-row">
            <span>Status: {order.status}</span>
            <span>Payment: {order.paymentStatus}</span>
          </div>

          <div className="order-confirmation-details">
            <div>
              <span className="order-confirmation-detail-icon" aria-hidden="true">
                <FontAwesomeIcon icon={fulfillmentIcon} />
              </span>
              <span>
                <strong>Fulfillment</strong>
                {fulfillmentLabel} · {fulfillmentValue}
              </span>
            </div>
            <div>
              <span className="order-confirmation-detail-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faFileLines} />
              </span>
              <span>
                <strong>Submitted</strong>
                <time dateTime={order.createdAt}>{formatOrderTimestamp(order.createdAt)}</time>
              </span>
            </div>
            <div>
              <span className="order-confirmation-detail-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faFileLines} />
              </span>
              <span>
                <strong>Requested items</strong>
                {order.totalQuantity} {order.totalQuantity === 1 ? "item" : "items"}
              </span>
            </div>
            <div>
              <span className="order-confirmation-detail-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faFileLines} />
              </span>
              <span>
                <strong>Customer</strong>
                {order.customer.fullName} · {order.customer.email}
              </span>
            </div>
          </div>

          <section className="order-confirmation-items" aria-labelledby="order-confirmation-items-title">
            <div className="order-confirmation-items-heading">
              <h3 id="order-confirmation-items-title">Submitted Items</h3>
              <span>Historical snapshot</span>
            </div>
            <ul>
              {order.items.map((item) => {
                const priceLabel = item.price > 0
                  ? formatCartCurrency(item.price)
                  : "Price on request";

                return (
                  <li key={item.product.id}>
                    <div>
                      <strong>{item.product.name}</strong>
                      <span>{item.product.partNumber} · Qty {item.quantity}</span>
                    </div>
                    <span>{priceLabel}</span>
                  </li>
                );
              })}
            </ul>
            <div className="order-confirmation-total">
              <span>Estimated subtotal</span>
              <strong>
                {order.estimatedSubtotal !== null
                  ? formatCartCurrency(order.estimatedSubtotal)
                  : "Final amount confirmed by staff"}
              </strong>
            </div>
          </section>

          {order.orderNotes ? (
            <p className="order-confirmation-order-note">
              <strong>Order notes:</strong> {order.orderNotes}
            </p>
          ) : null}

          <div className="order-confirmation-notice" role="note">
            <FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" />
            <p>
              This is an order request, not a guaranteed sale. ALD staff must confirm
              availability, compatibility, final amount, payment, and preparation
              details before fulfillment.
            </p>
          </div>

          <p className="order-confirmation-storage-note">
            This temporary frontend flow stores the request in localStorage on this
            browser. It is not connected to the ALD backend yet.
          </p>

          <div className="order-confirmation-actions">
            <Link
              className="order-confirmation-primary-link"
              href={`/track-order?reference=${encodeURIComponent(order.reference)}`}
            >
              Track Order
              <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
            </Link>
            <Link className="order-confirmation-secondary-link" href="/products">
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
