"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faCreditCard,
  faFileLines,
  faLocationDot,
  faTruck,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { AdminBadge } from "@/components/admin/AdminDataTable";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getAdminDeliveryRequest,
  getAdminDeliveryRequestsErrorMessage,
} from "@/lib/adminDeliveryRequestsApi";
import type { AdminDeliveryRequestDetails } from "@/lib/adminDeliveryRequestTypes";

function label(value: string | null | undefined) {
  return value
    ? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Not available";
}

function money(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value)
    : "Not available";
}

function deliveryFee(value: number | null | undefined) {
  return typeof value === "number" && value > 0 ? money(value) : "Not confirmed";
}

function date(value: string | null | undefined) {
  if (!value) return "Not available";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Not available"
    : new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

function safeHttpUrl(value: string | null): string | null {
  if (!value) return null;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

export default function RealAdminDeliveryRequestDetailsModal({
  deliveryId,
  onClose,
}: {
  deliveryId: number | null;
  onClose: () => void;
}) {
  const token = getAuthToken();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [delivery, setDelivery] = useState<AdminDeliveryRequestDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    if (deliveryId === null || !token) return;

    const controller = new AbortController();

    void getAdminDeliveryRequest(token, deliveryId, controller.signal)
      .then((result) => setDelivery(result.delivery_request))
      .catch((requestError) => {
        if (requestError instanceof Error && requestError.name === "AbortError") return;
        setError(getAdminDeliveryRequestsErrorMessage(requestError));
      });

    return () => controller.abort();
  }, [deliveryId, retryNonce, token]);

  useEffect(() => {
    if (deliveryId === null) return;

    const previousOverflow = document.body.style.overflow;
    const previousActiveElement = document.activeElement as HTMLElement | null;
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      previousActiveElement?.focus();
    };
  }, [deliveryId, onClose]);

  if (deliveryId === null) return null;
  const visibleError = error ?? (!token ? "Your Admin session is unavailable. Please sign in again." : null);
  const loading = Boolean(token) && delivery === null && error === null;
  const trackingUrl = safeHttpUrl(delivery?.tracking_url ?? null);

  return (
    <div className="admin-order-modal-overlay">
      <button className="admin-order-modal-backdrop" type="button" aria-label="Close delivery request details" onClick={onClose} />
      <section className="admin-order-modal" role="dialog" aria-modal="true" aria-labelledby="admin-delivery-details-title" aria-describedby="admin-delivery-details-description">
        <header className="admin-order-modal-header">
          <div className="admin-order-modal-heading">
            <p>Delivery Request Details</p>
            <h2 id="admin-delivery-details-title">{delivery?.order_reference ?? "Delivery request"}</h2>
            <span id="admin-delivery-details-description">Read-only details from the persisted order, payment, and delivery record.</span>
          </div>
          <div className="admin-order-modal-header-meta">
            {delivery ? <AdminBadge>{label(delivery.delivery_status)}</AdminBadge> : null}
            <button ref={closeButtonRef} className="admin-order-modal-close" type="button" aria-label="Close delivery request details" onClick={onClose}><FontAwesomeIcon icon={faXmark} aria-hidden="true" /></button>
          </div>
        </header>

        <div className="admin-order-modal-body">
          {loading ? <p className="py-12 text-center text-sm text-slate-500" role="status">Loading delivery request details…</p> : null}
          {visibleError ? <div className="my-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert"><p>{visibleError}</p>{error ? <button type="button" className="mt-3 font-semibold underline" onClick={() => { setError(null); setRetryNonce((nonce) => nonce + 1); }}>Retry</button> : null}</div> : null}
          {delivery ? <>
            <section className="admin-order-modal-section">
              <div className="admin-order-modal-section-title"><FontAwesomeIcon icon={faUser} aria-hidden="true" /><h3>Customer Information</h3></div>
              <dl className="admin-order-modal-detail-grid"><div><dt>Customer</dt><dd>{delivery.customer?.full_name ?? "Guest customer"}</dd></div><div><dt>Phone</dt><dd>{delivery.customer?.contact_number || "Not available"}</dd></div><div><dt>Email</dt><dd>{delivery.customer?.email || "Not available"}</dd></div><div><dt>Profile Address</dt><dd>{delivery.customer?.address || "Not available"}</dd></div></dl>
            </section>

            <section className="admin-order-modal-section">
              <div className="admin-order-modal-section-title"><FontAwesomeIcon icon={faFileLines} aria-hidden="true" /><h3>Order Information</h3></div>
              <dl className="admin-order-modal-detail-grid admin-order-modal-order-grid"><div><dt>Order Reference</dt><dd>{delivery.order_reference ?? "Not available"}</dd></div><div><dt>Order Status</dt><dd>{label(delivery.order?.status ?? delivery.order_status)}</dd></div><div><dt>Fulfillment</dt><dd>{label(delivery.order?.fulfillment_method)}</dd></div><div><dt>Order Total</dt><dd className="admin-order-modal-total">{money(delivery.order?.total_amount ?? delivery.amount)}</dd></div></dl>
            </section>

            <section className="admin-order-modal-section">
              <div className="admin-order-modal-section-title"><FontAwesomeIcon icon={faCartShopping} aria-hidden="true" /><h3>Order Items</h3></div>
              {delivery.order?.items.length ? <div className="admin-order-items-table-wrap overflow-x-auto"><table className="admin-order-items-table min-w-[560px]"><thead><tr><th scope="col">Product</th><th scope="col">Qty</th><th scope="col">Price</th><th scope="col">Subtotal</th></tr></thead><tbody>{delivery.order.items.map((item, index) => <tr key={`${item.product_id}-${index}`}><td>{item.name}<small className="block text-slate-500">{item.part_number ?? "No part number"}</small></td><td>{item.quantity}</td><td>{money(item.unit_price)}</td><td>{money(item.line_total)}</td></tr>)}</tbody><tfoot><tr><th scope="row" colSpan={3}>Total</th><td>{money(delivery.order?.total_amount ?? delivery.amount)}</td></tr></tfoot></table></div> : <p className="text-sm text-slate-500">No order item snapshots are available.</p>}
            </section>

            <section className="admin-order-modal-section">
              <div className="admin-order-modal-section-title"><FontAwesomeIcon icon={faTruck} aria-hidden="true" /><h3>Delivery Information</h3></div>
              <dl className="admin-order-modal-detail-grid admin-order-modal-order-grid"><div className="col-span-full"><dt>Delivery Address</dt><dd>{delivery.delivery_address}</dd></div><div><dt>Branch</dt><dd>{delivery.branch?.name ?? "Not assigned"}</dd></div><div><dt>Assigned Staff</dt><dd>{delivery.assigned_staff?.name ?? "Unassigned"}</dd></div><div><dt>Delivery Fee</dt><dd>{deliveryFee(delivery.delivery_fee)}</dd></div><div><dt>Delivery Status</dt><dd><AdminBadge>{label(delivery.delivery_status)}</AdminBadge></dd></div><div><dt>Created</dt><dd>{date(delivery.created_at)}</dd></div><div><dt>Delivered At</dt><dd>{date(delivery.delivered_at)}</dd></div><div className="col-span-full"><dt>Delivery Notes</dt><dd className="whitespace-pre-line">{delivery.remarks || "No delivery notes recorded"}</dd></div></dl>
            </section>

            <section className="admin-order-modal-section">
              <div className="admin-order-modal-section-title"><FontAwesomeIcon icon={faLocationDot} aria-hidden="true" /><h3>Manual Booking Details</h3></div>
              <dl className="admin-order-modal-detail-grid admin-order-modal-order-grid"><div><dt>Booking Reference</dt><dd>{delivery.booking_reference || "Not recorded"}</dd></div><div><dt>Tracking URL</dt><dd>{trackingUrl ? <a className="break-all text-orange-700 underline" href={trackingUrl} target="_blank" rel="noreferrer">{trackingUrl}</a> : delivery.tracking_url || "Not recorded"}</dd></div><div><dt>Rider</dt><dd>{delivery.rider_name || "Not recorded"}</dd></div><div><dt>Rider Contact</dt><dd>{delivery.rider_contact || "Not recorded"}</dd></div></dl>
              <p className="mt-3 text-sm text-slate-500">Booking and delivery updates are entered manually by branch Staff. This page does not book or track with Lalamove.</p>
              {delivery.delivery_status === "waiting_for_booking" ? <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="status">{delivery.payment?.status === "paid" ? "Payment has been confirmed. This delivery is waiting for manual Lalamove booking." : "Payment is not confirmed. Staff booking remains unavailable until the latest payment is verified."}</p> : null}
            </section>

            <section className="admin-order-modal-section">
              <div className="admin-order-modal-section-title"><FontAwesomeIcon icon={faCreditCard} aria-hidden="true" /><h3>Payment Information</h3></div>
              {delivery.payment ? <dl className="admin-order-modal-detail-grid admin-order-modal-order-grid"><div><dt>Method</dt><dd>{label(delivery.payment.method)}</dd></div><div><dt>Payment Status</dt><dd><AdminBadge>{label(delivery.payment.status)}</AdminBadge></dd></div><div><dt>Amount</dt><dd>{money(delivery.payment.amount)}</dd></div><div><dt>Reference</dt><dd>{delivery.payment.reference || "Not available"}</dd></div><div><dt>Verified At</dt><dd>{date(delivery.payment.verified_at)}</dd></div></dl> : <p className="text-sm text-slate-500">No payment record is associated with this order.</p>}
            </section>
          </> : null}
        </div>

        <footer className="admin-order-modal-footer"><span /><div className="admin-order-modal-footer-actions"><button className="admin-order-modal-button admin-order-modal-button-secondary" type="button" onClick={onClose}>Close</button></div></footer>
      </section>
    </div>
  );
}
