"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faCheck,
  faCircleInfo,
  faCreditCard,
  faFileLines,
  faPhone,
  faStore,
  faTruck,
} from "@fortawesome/free-solid-svg-icons";
import {
  getPaymentMethodLabel,
  type OrderConfirmationData,
} from "@/lib/orders/orderRequestTypes";
import { formatCartCurrency, isUsablePrice } from "../cart/cartData";
import { getOrderConfirmation } from "@/lib/orders/orderConfirmationStorage";
import { formatOrderTimestamp } from "./checkoutUtils";

type OrderConfirmationPageProps = {
  reference: string;
};

export default function OrderConfirmationPage({
  reference,
}: OrderConfirmationPageProps) {
  const [order, setOrder] = useState<OrderConfirmationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Browser storage is read after hydration to avoid server/client markup drift.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate the saved order request after the client mounts
    setOrder(getOrderConfirmation(reference));
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
            This browser does not have a saved server confirmation with that reference.
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

  const isPickup = order.fulfillment_method === "pickup";
  const fulfillmentLabel = isPickup ? "Store Pickup" : "Lalamove Delivery";
  const fulfillmentValue = isPickup
    ? order.branch?.name ?? "Branch details unavailable"
    : order.delivery?.address ?? "Delivery address unavailable";
  const fulfillmentIcon = isPickup ? faStore : faTruck;
  const totalQuantity = order.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  const formatStatus = (status: string) => {
    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  };

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
            Your request was saved by ALD Motorshop and is ready for staff review.
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
            <span>Status: {formatStatus(order.status)}</span>
            <span>Payment: {formatStatus(order.payment_status)}</span>
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
                <time dateTime={order.created_at ?? undefined}>
                  {order.created_at
                    ? formatOrderTimestamp(order.created_at)
                    : "Date unavailable"}
                </time>
              </span>
            </div>
            <div>
              <span className="order-confirmation-detail-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faCreditCard} />
              </span>
              <span>
                <strong>Payment method</strong>
                {getPaymentMethodLabel(order.payment?.method)}
              </span>
            </div>
            <div>
              <span className="order-confirmation-detail-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faFileLines} />
              </span>
              <span>
                <strong>Requested items</strong>
                {totalQuantity} {totalQuantity === 1 ? "item" : "items"}
              </span>
            </div>
            <div>
              <span className="order-confirmation-detail-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faFileLines} />
              </span>
              <span>
                <strong>Customer</strong>
                {order.customer
                  ? `${order.customer.full_name} · ${order.customer.email}`
                  : "Customer details unavailable"}
              </span>
            </div>
            <div>
              <span className="order-confirmation-detail-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faPhone} />
              </span>
              <span>
                <strong>Contact Number</strong>
                {order.customer?.contact_number || "Contact number unavailable"}
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
                const unitPriceLabel = isUsablePrice(item.unit_price)
                  ? formatCartCurrency(item.unit_price)
                  : "Price unavailable";
                const lineTotalLabel = isUsablePrice(item.line_total)
                  ? formatCartCurrency(item.line_total)
                  : "Price unavailable";

                return (
                  <li key={item.product_id}>
                    <div className="order-confirmation-item-product">
                      <strong>{item.name}</strong>
                      <span>
                        {item.part_number ?? "Part number unavailable"} · Qty {item.quantity}
                      </span>
                    </div>
                    <div className="order-confirmation-item-price">
                      <span>Unit price</span>
                      <strong>{unitPriceLabel}</strong>
                    </div>
                    <div className="order-confirmation-item-price">
                      <span>Line total</span>
                      <strong>{lineTotalLabel}</strong>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="order-confirmation-total">
              <span>Subtotal</span>
              <strong>
                {formatCartCurrency(order.subtotal)}
              </strong>
            </div>
            <div className="order-confirmation-total">
              <span>Estimated total</span>
              <strong>
                {formatCartCurrency(order.estimated_total)}
              </strong>
            </div>
            <div className="order-confirmation-total">
              <span>Delivery fee</span>
              <strong>{formatCartCurrency(order.delivery_fee)}</strong>
            </div>
          </section>

          {order.customer_notes ? (
            <p className="order-confirmation-order-note">
              <strong>Order notes:</strong> {order.customer_notes}
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
            This confirmation is based on the real Laravel response saved for this
            browser. Full order retrieval and tracking APIs are planned separately.
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
