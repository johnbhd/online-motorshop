"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faCheck,
  faCircleInfo,
  faCreditCard,
  faFileLines,
  faLocationDot,
  faTruck,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { AdminBadge } from "@/components/admin/AdminDataTable";
import AdminStatusOverrideDialog from "@/components/admin/AdminStatusOverrideDialog";
import AdminAuditHistory from "@/components/admin/AdminAuditHistory";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getAdminDeliveryRequest,
  getAdminDeliveryRequestsErrorMessage,
  updateAdminDeliveryStatus,
  type AdminDeliveryStatusUpdate,
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

function actionLabel(status: string) {
  switch (status) {
    case "booked":
      return "Record Lalamove Booking";
    case "picked_up":
      return "Mark Picked Up";
    case "in_transit":
      return "Mark In Transit";
    case "delivered":
      return "Mark Delivered";
    case "failed":
      return "Record Failed Delivery";
    case "cancelled":
      return "Cancel Delivery";
    default:
      return `Move to ${label(status)}`;
  }
}

function actionDescription(status: string) {
  switch (status) {
    case "booked":
      return "Book Lalamove manually outside ALD, then save the booking reference here.";
    case "picked_up":
      return "Confirm that the assigned rider has picked up the delivery.";
    case "in_transit":
      return "Confirm that the picked-up delivery is now in transit.";
    case "delivered":
      return "Confirm that the customer has received the delivery.";
    case "failed":
      return "Record that this delivery failed. Retry or rescheduling is handled outside this workflow.";
    case "cancelled":
      return "Confirm that this delivery request should be cancelled.";
    default:
      return "Confirm this supported delivery status transition.";
  }
}

export default function RealAdminDeliveryRequestDetailsModal({
  deliveryId,
  onClose,
  onUpdated,
}: {
  deliveryId: number | null;
  onClose: () => void;
  onUpdated?: (delivery: AdminDeliveryRequestDetails) => void;
}) {
  const token = getAuthToken();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const confirmationButtonRef = useRef<HTMLButtonElement>(null);
  const [delivery, setDelivery] = useState<AdminDeliveryRequestDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmationStatus, setConfirmationStatus] = useState<string | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<string | null>(null);
  const [bookingReference, setBookingReference] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [riderName, setRiderName] = useState("");
  const [riderContact, setRiderContact] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    if (deliveryId === null || !token) return;

    const controller = new AbortController();

    void getAdminDeliveryRequest(token, deliveryId, controller.signal)
      .then((result) => {
        const nextDelivery = result.delivery_request;

        setDelivery(nextDelivery);
        setBookingReference(nextDelivery.booking_reference ?? "");
        setTrackingUrl(nextDelivery.tracking_url ?? "");
        setRiderName(nextDelivery.rider_name ?? "");
        setRiderContact(nextDelivery.rider_contact ?? "");
        setVehiclePlate(nextDelivery.vehicle_plate ?? "");
        setRemarks(nextDelivery.remarks ?? "");
        setUpdateError(null);
        setConfirmationStatus(null);
      })
      .catch((requestError) => {
        if (requestError instanceof Error && requestError.name === "AbortError") return;
        setError(getAdminDeliveryRequestsErrorMessage(requestError));
      });

    return () => controller.abort();
  }, [deliveryId, retryNonce, token]);

  async function handleStatusUpdate(status: string, reason?: string) {
    if (!delivery || isUpdating) return;

    if (!delivery.allowed_statuses.includes(status) && !reason) {
      setOverrideStatus(status);
      setConfirmationStatus(null);
      return;
    }

    if (!delivery.allowed_statuses.includes(status) && !reason?.trim()) {
      setConfirmationStatus(null);
      setUpdateError("This delivery status has already changed. Refresh to view the latest status.");
      return;
    }

    if (status === "booked" && !bookingReference.trim()) {
      setConfirmationStatus(null);
      setUpdateError("Enter the Lalamove booking reference before recording the booking.");
      return;
    }

    const authToken = getAuthToken();

    if (!authToken) {
      setUpdateError("Your Admin session has expired. Please sign in again.");
      return;
    }

    const update: AdminDeliveryStatusUpdate = { status, ...(reason?.trim() ? { reason: reason.trim() } : {}) };

    if (bookingReference.trim()) update.booking_reference = bookingReference.trim();
    if (trackingUrl.trim()) update.tracking_url = trackingUrl.trim();
    if (riderName.trim()) update.rider_name = riderName.trim();
    if (riderContact.trim()) update.rider_contact = riderContact.trim();
    if (vehiclePlate.trim()) update.vehicle_plate = vehiclePlate.trim();
    if (remarks.trim()) update.remarks = remarks.trim();

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const result = await updateAdminDeliveryStatus(authToken, delivery.id, update);
      const nextDelivery = result.delivery_request;

      setDelivery(nextDelivery);
      setBookingReference(nextDelivery.booking_reference ?? "");
      setTrackingUrl(nextDelivery.tracking_url ?? "");
      setRiderName(nextDelivery.rider_name ?? "");
      setRiderContact(nextDelivery.rider_contact ?? "");
      setVehiclePlate(nextDelivery.vehicle_plate ?? "");
      setRemarks(nextDelivery.remarks ?? "");
      setConfirmationStatus(null);
      onUpdated?.(nextDelivery);
    } catch (requestError) {
      setUpdateError(getAdminDeliveryRequestsErrorMessage(requestError));
    } finally {
      setIsUpdating(false);
    }
  }

  useEffect(() => {
    if (deliveryId === null) return;

    const previousOverflow = document.body.style.overflow;
    const previousActiveElement = document.activeElement as HTMLElement | null;
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (confirmationStatus) {
        setConfirmationStatus(null);
        return;
      }

      onClose();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      previousActiveElement?.focus();
    };
  }, [confirmationStatus, deliveryId, onClose]);

  useEffect(() => {
    if (!confirmationStatus) return;

    const focusFrame = window.requestAnimationFrame(() => confirmationButtonRef.current?.focus());

    return () => window.cancelAnimationFrame(focusFrame);
  }, [confirmationStatus]);

  if (deliveryId === null) return null;
  const visibleError = error ?? (!token ? "Your Admin session is unavailable. Please sign in again." : null);
  const loading = Boolean(token) && delivery === null && error === null;
  const trackingUrlLink = safeHttpUrl(delivery?.tracking_url ?? null);
  const nextStatus = delivery?.allowed_statuses[0] ?? null;
  const needsBookingFields = nextStatus === "booked";
  const needsRiderFields = nextStatus === "picked_up";

  return (
    <div className="admin-order-modal-overlay">
      <button className="admin-order-modal-backdrop" type="button" aria-label="Close delivery request details" onClick={onClose} />
      <section className="admin-order-modal" role="dialog" aria-modal="true" aria-labelledby="admin-delivery-details-title" aria-describedby="admin-delivery-details-description">
        <header className="admin-order-modal-header">
          <div className="admin-order-modal-heading">
            <p>Delivery Request Details</p>
            <h2 id="admin-delivery-details-title">{delivery?.order_reference ?? "Delivery request"}</h2>
            <span id="admin-delivery-details-description">Persisted order, payment, and delivery details with Admin status controls.</span>
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
              <div className="admin-order-modal-section-title"><FontAwesomeIcon icon={faLocationDot} aria-hidden="true" /><h3>Manual Lalamove Details</h3></div>
              <dl className="admin-order-modal-detail-grid admin-order-modal-order-grid"><div><dt>Booking Reference</dt><dd>{delivery.booking_reference || "Not recorded"}</dd></div><div><dt>Tracking URL</dt><dd>{trackingUrlLink ? <a className="break-all text-orange-700 underline" href={trackingUrlLink} target="_blank" rel="noreferrer">{trackingUrlLink}</a> : delivery.tracking_url || "Not recorded"}</dd></div><div><dt>Rider</dt><dd>{delivery.rider_name || "Not recorded"}</dd></div><div><dt>Rider Contact</dt><dd>{delivery.rider_contact || "Not recorded"}</dd></div><div><dt>Vehicle Plate</dt><dd>{delivery.vehicle_plate || "Not recorded"}</dd></div></dl>
              <p className="mt-3 text-sm text-slate-500">Admin can record the manual Lalamove booking and progress the delivery lifecycle. This page does not contact Lalamove.</p>
              {delivery.delivery_status === "waiting_for_booking" ? <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="status">{delivery.payment?.status === "paid" ? "Payment has been confirmed. This delivery is waiting for manual Lalamove booking." : "Payment is not confirmed. Manual booking is unavailable until the latest payment is verified."}</p> : null}
              {nextStatus ? <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
                <div className="flex items-start gap-3">
                  <FontAwesomeIcon icon={nextStatus === "delivered" ? faCheck : faTruck} className="mt-1 text-orange-600" aria-hidden="true" />
                  <div><h3 className="font-semibold text-[#0B1930]">Next Admin action</h3><p className="mt-1 text-sm leading-5 text-slate-600">{actionDescription(nextStatus)}</p></div>
                </div>
                {needsBookingFields ? <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">Booking Reference <span className="text-red-600">*</span><input value={bookingReference} onChange={(event) => setBookingReference(event.target.value)} placeholder="Manual Lalamove reference" className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label>
                  <label className="text-sm font-medium text-slate-700">Tracking URL <span className="font-normal text-slate-500">(optional)</span><input type="url" value={trackingUrl} onChange={(event) => setTrackingUrl(event.target.value)} placeholder="https://..." className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label>
                </div> : null}
                {needsRiderFields ? <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">Rider Name<input value={riderName} onChange={(event) => setRiderName(event.target.value)} placeholder="Persisted rider name" className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label>
                  <label className="text-sm font-medium text-slate-700">Rider Contact<input value={riderContact} onChange={(event) => setRiderContact(event.target.value)} placeholder="Persisted rider contact" className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label>
                  <label className="text-sm font-medium text-slate-700">Vehicle Plate<input value={vehiclePlate} onChange={(event) => setVehiclePlate(event.target.value)} placeholder="Optional plate number" className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label>
                </div> : null}
                <label className="mt-4 block text-sm font-medium text-slate-700">Remarks<textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} rows={3} placeholder="Optional operational note" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label>
                <button type="button" onClick={() => setConfirmationStatus(nextStatus)} disabled={isUpdating || (needsBookingFields && !bookingReference.trim())} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"><FontAwesomeIcon icon={nextStatus === "delivered" ? faCheck : faTruck} aria-hidden="true" />{isUpdating ? "Updating…" : actionLabel(nextStatus)}</button>
                {updateError && !confirmationStatus ? <p className="mt-3 text-sm text-red-700" role="alert">{updateError}</p> : null}
              </div> : <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500"><FontAwesomeIcon icon={faCircleInfo} className="mt-0.5 shrink-0 text-orange-500" aria-hidden="true" />This delivery request has no further forward status action.</p>}
              {delivery.override_statuses.length ? <label className="admin-order-modal-field mt-4 block"><span>Admin correction / rollback</span><select value="" disabled={isUpdating} onChange={(event) => { if (event.target.value) setOverrideStatus(event.target.value); }}><option value="">Choose a correction</option>{delivery.override_statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select><small>A reason is required and existing booking and rider evidence is preserved.</small></label> : null}
            </section>

            <section className="admin-order-modal-section">
              <div className="admin-order-modal-section-title"><FontAwesomeIcon icon={faCreditCard} aria-hidden="true" /><h3>Payment Information</h3></div>
              {delivery.payment ? <dl className="admin-order-modal-detail-grid admin-order-modal-order-grid"><div><dt>Method</dt><dd>{label(delivery.payment.method)}</dd></div><div><dt>Payment Status</dt><dd><AdminBadge>{label(delivery.payment.status)}</AdminBadge></dd></div><div><dt>Amount</dt><dd>{money(delivery.payment.amount)}</dd></div><div><dt>Reference</dt><dd>{delivery.payment.reference || "Not available"}</dd></div><div><dt>Verified At</dt><dd>{date(delivery.payment.verified_at)}</dd></div></dl> : <p className="text-sm text-slate-500">No payment record is associated with this order.</p>}
            </section>
            <AdminAuditHistory entries={delivery.status_overrides} />
          </> : null}
        </div>

        <footer className="admin-order-modal-footer"><span /><div className="admin-order-modal-footer-actions"><button className="admin-order-modal-button admin-order-modal-button-secondary" type="button" onClick={onClose}>Close</button></div></footer>
      </section>

      {confirmationStatus ? <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/40 p-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl" role="alertdialog" aria-modal="true" aria-labelledby="admin-delivery-confirmation-title" aria-describedby="admin-delivery-confirmation-description">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-600"><FontAwesomeIcon icon={confirmationStatus === "delivered" ? faCheck : faTruck} aria-hidden="true" /></span>
            <div>
              <h3 id="admin-delivery-confirmation-title" className="font-semibold text-[#0B1930]">{actionLabel(confirmationStatus)}?</h3>
              <p id="admin-delivery-confirmation-description" className="mt-2 text-sm leading-6 text-slate-600">{actionDescription(confirmationStatus)}</p>
              <p className="mt-2 text-xs text-slate-500">{delivery?.order_reference ?? "Delivery request"} · {delivery?.branch?.name ?? "All branches"}</p>
            </div>
          </div>
          {updateError ? <p className="mt-4 text-sm text-red-700" role="alert">{updateError}</p> : null}
          <div className="mt-6 flex justify-end gap-3">
            <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button" onClick={() => setConfirmationStatus(null)}>Cancel</button>
            <button ref={confirmationButtonRef} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60" type="button" disabled={isUpdating} onClick={() => void handleStatusUpdate(confirmationStatus)}>{isUpdating ? "Updating…" : actionLabel(confirmationStatus)}</button>
          </div>
        </div>
      </div> : null}
      {delivery && overrideStatus ? <AdminStatusOverrideDialog open title="Correct delivery status" currentStatus={delivery.delivery_status} targetStatus={overrideStatus} onClose={() => setOverrideStatus(null)} onConfirm={(reason) => { void handleStatusUpdate(overrideStatus, reason); setOverrideStatus(null); }} isSubmitting={isUpdating} description="Use this to correct a delivery workflow mistake. Booking, rider, and payment evidence are preserved while the operational status changes." /> : null}
    </div>
  );
}
