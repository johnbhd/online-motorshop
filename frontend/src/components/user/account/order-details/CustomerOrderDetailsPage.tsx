"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faRoute } from "@fortawesome/free-solid-svg-icons";
import { useDemoAuth } from "@/components/auth/DemoAuthProvider";
import {
  getDemoOrderByReferenceForCustomer,
} from "@/lib/orders/orderStorage";
import type { DemoOrder } from "@/lib/orders/orderTypes";
import OrderDetailsView from "../../orders/OrderDetailsView";

type CustomerOrderDetailsPageProps = {
  reference: string;
};

export default function CustomerOrderDetailsPage({
  reference,
}: CustomerOrderDetailsPageProps) {
  const { isReady: isAuthReady, session } = useDemoAuth();
  const customerAccountId =
    session?.role === "customer" ? session.id : null;
  const [order, setOrder] = useState<DemoOrder | null>(null);
  const [isOrderReady, setIsOrderReady] = useState(false);

  useEffect(() => {
    if (!isAuthReady || !customerAccountId) {
      return;
    }

    const ownedOrder = getDemoOrderByReferenceForCustomer(
      reference,
      customerAccountId,
    );

    // TEMPORARY CUSTOMER ORDER HISTORY DEMO.
    // Ownership is checked by account ID before the shared detail view renders.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate the owned local order after auth is ready
    setOrder(ownedOrder);
    setIsOrderReady(true);
  }, [customerAccountId, isAuthReady, reference]);

  if (!isOrderReady || !customerAccountId) {
    return (
      <div className="customer-order-details-page">
        <section className="customer-orders-loading" aria-live="polite">
          Loading order details…
        </section>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="customer-order-details-page">
        <section className="customer-order-not-found" aria-labelledby="customer-order-not-found-title">
          <p className="customer-orders-eyebrow">Customer Account</p>
          <h1 id="customer-order-not-found-title">Order not found</h1>
          <p>
            We could not find that order in your account. Check your order list or use public Track Order with your reference and contact number.
          </p>
          <div className="customer-order-not-found-actions">
            <Link className="customer-orders-primary-link" href="/account/orders">
              <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
              <span>Back to My Orders</span>
            </Link>
            <Link className="customer-orders-secondary-link" href="/track-order">
              <FontAwesomeIcon icon={faRoute} aria-hidden="true" />
              <span>Track an Order</span>
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="customer-order-details-page">
      <section
        className="customer-orders-hero customer-orders-detail-hero"
        aria-labelledby="customer-order-details-title"
      >
        <div className="customer-orders-shell">
          <Link className="customer-orders-back-link" href="/account/orders">
            <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
            <span>Back to My Orders</span>
          </Link>
          <p className="customer-orders-eyebrow">Customer Account</p>
          <h1 id="customer-order-details-title">Order Details</h1>
          <p>{order.reference}</p>
        </div>
      </section>
      <OrderDetailsView order={order} />
    </div>
  );
}
