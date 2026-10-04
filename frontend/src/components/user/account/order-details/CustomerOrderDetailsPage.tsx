"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faRoute } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getCustomerOrder,
  getOrderApiErrorMessage,
  OrderApiError,
} from "@/lib/orders/orderApi";
import { toOrderViewModel } from "@/lib/orders/orderAdapter";
import type { OrderViewModel } from "@/lib/orders/orderTypes";
import OrderDetailsView from "../../orders/OrderDetailsView";

type CustomerOrderDetailsPageProps = {
  reference: string;
};

export default function CustomerOrderDetailsPage({
  reference,
}: CustomerOrderDetailsPageProps) {
  const { isLoading: isAuthLoading, user } = useAuth();
  const isAuthReady = !isAuthLoading;
  const isCustomer = user?.role === "customer";
  const [order, setOrder] = useState<OrderViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!isAuthReady || !isCustomer) {
      return;
    }

    const token = getAuthToken();
    const controller = new AbortController();

    if (!token) {
      // The auth token is external browser state; reflect its absence before starting the request.
      /* eslint-disable react-hooks/set-state-in-effect */
      setOrder(null);
      setError("Your session has expired. Please sign in again.");
      setNotFound(false);
      setIsLoading(false);
      /* eslint-enable react-hooks/set-state-in-effect */
      return () => controller.abort();
    }

    setIsLoading(true);
    setError("");
    setNotFound(false);

    getCustomerOrder(token, reference, controller.signal)
      .then((response) => {
        setOrder(toOrderViewModel(response.order));
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof Error && requestError.name === "AbortError") {
          return;
        }

        setOrder(null);
        setNotFound(
          requestError instanceof OrderApiError && requestError.status === 404,
        );
        setError(
          getOrderApiErrorMessage(
            requestError,
            "We could not load this order right now. Please try again.",
          ),
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [isAuthReady, isCustomer, reference, retryKey]);

  if (isAuthLoading || !isCustomer || isLoading) {
    return (
      <div className="customer-order-details-page">
        <section className="customer-orders-loading" aria-live="polite">
          Loading order details…
        </section>
      </div>
    );
  }

  if (error && !notFound) {
    return (
      <div className="customer-order-details-page">
        <section className="customer-order-error" role="alert">
          <p className="customer-orders-eyebrow">Customer Account</p>
          <h1>Order details unavailable</h1>
          <p>{error}</p>
          <div className="customer-order-not-found-actions">
            <button
              className="customer-orders-primary-link"
              type="button"
              onClick={() => setRetryKey((currentKey) => currentKey + 1)}
            >
              Try again
            </button>
            <Link className="customer-orders-secondary-link" href="/account/orders">
              <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
              <span>Back to My Orders</span>
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (!order || notFound) {
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
