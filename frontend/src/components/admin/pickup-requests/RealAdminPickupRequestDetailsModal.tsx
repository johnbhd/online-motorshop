"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faCreditCard,
  faFileLines,
  faStore,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { AdminBadge } from "@/components/admin/AdminDataTable";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getAdminPickupRequest,
  getAdminPickupRequestsErrorMessage,
} from "@/lib/adminPickupRequestsApi";
import type { AdminPickupDetails } from "@/lib/adminPickupRequestTypes";

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

function date(value: string | null | undefined) {
  if (!value) return "Not available";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Not available"
    : new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

function schedule(day: string | null, time: string | null) {
  const dayLabel = day
    ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(`${day}T00:00:00`))
    : "Not scheduled";
  const timeLabel = time
    ? new Intl.DateTimeFormat("en-PH", { timeStyle: "short" }).format(new Date(`1970-01-01T${time}`))
    : null;
  return timeLabel ? `${dayLabel} · ${timeLabel}` : dayLabel;
}

export default function RealAdminPickupRequestDetailsModal({
  pickupId,
  onClose,
}: {
  pickupId: number | null;
  onClose: () => void;
}) {
  const token = getAuthToken();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [pickup, setPickup] = useState<AdminPickupDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    if (pickupId === null) return;
    if (!token) return;

    const controller = new AbortController();

    void getAdminPickupRequest(token, pickupId, controller.signal)
      .then((result) => setPickup(result.pickup_request))
      .catch((requestError) => {
        if (requestError instanceof Error && requestError.name === "AbortError") return;
        setError(getAdminPickupRequestsErrorMessage(requestError));
      });

    return () => controller.abort();
  }, [pickupId, retryNonce, token]);

  useEffect(() => {
    if (pickupId === null) return;

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
  }, [onClose, pickupId]);

  if (pickupId === null) return null;
  const visibleError = error ?? (!token ? "Your Admin session is unavailable. Please sign in again." : null);
  const loading = Boolean(token) && pickup === null && error === null;

  return (
    <div className="admin-order-modal-overlay">
      <button className="admin-order-modal-backdrop" type="button" aria-label="Close pickup request details" onClick={onClose} />
      <section className="admin-order-modal" role="dialog" aria-modal="true" aria-labelledby="admin-pickup-details-title" aria-describedby="admin-pickup-details-description">
        <header className="admin-order-modal-header">
          <div className="admin-order-modal-heading">
            <p>Pickup Request Details</p>
            <h2 id="admin-pickup-details-title">{pickup?.order_reference ?? "Pickup request"}</h2>
            <span id="admin-pickup-details-description">Read-only details from the persisted order and pickup record.</span>
          </div>
          <div className="admin-order-modal-header-meta">
            {pickup ? <AdminBadge>{label(pickup.pickup_status)}</AdminBadge> : null}
            <button ref={closeButtonRef} className="admin-order-modal-close" type="button" aria-label="Close pickup request details" onClick={onClose}><FontAwesomeIcon icon={faXmark} aria-hidden="true" /></button>
          </div>
        </header>

        <div className="admin-order-modal-body">
          {loading ? <p className="py-12 text-center text-sm text-slate-500" role="status">Loading pickup request details…</p> : null}
          {visibleError ? <div className="my-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert"><p>{visibleError}</p>{error ? <button type="button" className="mt-3 font-semibold underline" onClick={() => { setError(null); setRetryNonce((nonce) => nonce + 1); }}>Retry</button> : null}</div> : null}
          {pickup ? <>
            <section className="admin-order-modal-section">
              <div className="admin-order-modal-section-title"><FontAwesomeIcon icon={faUser} aria-hidden="true" /><h3>Customer Information</h3></div>
              <dl className="admin-order-modal-detail-grid">
                <div><dt>Customer</dt><dd>{pickup.customer?.full_name ?? "Guest customer"}</dd></div>
                <div><dt>Phone</dt><dd>{pickup.customer?.contact_number || "Not available"}</dd></div>
                <div><dt>Email</dt><dd>{pickup.customer?.email || "Not available"}</dd></div>
                <div><dt>Address</dt><dd>{pickup.customer?.address || "Not available"}</dd></div>
              </dl>
            </section>

            <section className="admin-order-modal-section">
              <div className="admin-order-modal-section-title"><FontAwesomeIcon icon={faFileLines} aria-hidden="true" /><h3>Order Information</h3></div>
              <dl className="admin-order-modal-detail-grid admin-order-modal-order-grid">
                <div><dt>Order Reference</dt><dd>{pickup.order_reference ?? "Not available"}</dd></div>
                <div><dt>Order Status</dt><dd>{label(pickup.order?.status ?? pickup.order_status)}</dd></div>
                <div><dt>Fulfillment</dt><dd>{label(pickup.order?.fulfillment_method)}</dd></div>
                <div><dt>Order Total</dt><dd className="admin-order-modal-total">{money(pickup.order?.total_amount ?? pickup.amount)}</dd></div>
              </dl>
            </section>

            <section className="admin-order-modal-section">
              <div className="admin-order-modal-section-title"><FontAwesomeIcon icon={faCartShopping} aria-hidden="true" /><h3>Order Items</h3></div>
              {pickup.order?.items.length ? <div className="admin-order-items-table-wrap overflow-x-auto"><table className="admin-order-items-table min-w-[560px]"><thead><tr><th scope="col">Product</th><th scope="col">Qty</th><th scope="col">Price</th><th scope="col">Subtotal</th></tr></thead><tbody>{pickup.order.items.map((item, index) => <tr key={`${item.product_id}-${index}`}><td>{item.name}<small className="block text-slate-500">{item.part_number ?? "No part number"}</small></td><td>{item.quantity}</td><td>{money(item.unit_price)}</td><td>{money(item.line_total)}</td></tr>)}</tbody><tfoot><tr><th scope="row" colSpan={3}>Total</th><td>{money(pickup.order?.total_amount ?? pickup.amount)}</td></tr></tfoot></table></div> : <p className="text-sm text-slate-500">No order item snapshots are available.</p>}
            </section>

            <section className="admin-order-modal-section">
              <div className="admin-order-modal-section-title"><FontAwesomeIcon icon={faStore} aria-hidden="true" /><h3>Pickup Information</h3></div>
              <dl className="admin-order-modal-detail-grid admin-order-modal-order-grid">
                <div><dt>Pickup Branch</dt><dd>{pickup.branch?.name ?? "Not assigned"}</dd></div>
                <div><dt>Schedule</dt><dd>{schedule(pickup.pickup_date, pickup.pickup_time)}</dd></div>
                <div><dt>Assigned Staff</dt><dd>{pickup.assigned_staff?.name ?? "Unassigned"}</dd></div>
                <div><dt>Request Created</dt><dd>{date(pickup.created_at)}</dd></div>
                <div><dt>Completed At</dt><dd>{date(pickup.completed_at)}</dd></div>
                <div><dt>Remarks</dt><dd>{pickup.remarks || "No remarks recorded"}</dd></div>
              </dl>
            </section>

            <section className="admin-order-modal-section">
              <div className="admin-order-modal-section-title"><FontAwesomeIcon icon={faCreditCard} aria-hidden="true" /><h3>Payment Information</h3></div>
              {pickup.payment ? <dl className="admin-order-modal-detail-grid admin-order-modal-order-grid"><div><dt>Method</dt><dd>{label(pickup.payment.method)}</dd></div><div><dt>Payment Status</dt><dd><AdminBadge>{label(pickup.payment.status)}</AdminBadge></dd></div><div><dt>Amount</dt><dd>{money(pickup.payment.amount)}</dd></div><div><dt>Reference</dt><dd>{pickup.payment.reference || "Not available"}</dd></div><div><dt>Verified At</dt><dd>{date(pickup.payment.verified_at)}</dd></div></dl> : <p className="text-sm text-slate-500">No payment record is associated with this order.</p>}
            </section>
          </> : null}
        </div>

        <footer className="admin-order-modal-footer"><span /><div className="admin-order-modal-footer-actions"><button className="admin-order-modal-button admin-order-modal-button-secondary" type="button" onClick={onClose}>Close</button></div></footer>
      </section>
    </div>
  );
}
