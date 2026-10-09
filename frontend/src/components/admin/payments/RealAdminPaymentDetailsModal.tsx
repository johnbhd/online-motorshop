"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faCheck,
  faCircleInfo,
  faCreditCard,
  faImage,
  faStore,
  faTruck,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { AdminBadge } from "@/components/admin/AdminDataTable";
import BranchModalShell from "@/components/admin/branches/BranchModalShell";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getAdminPayment,
  getAdminPaymentsErrorMessage,
  updateAdminPaymentStatus,
} from "@/lib/adminPaymentsApi";
import type { AdminPaymentDetails } from "@/lib/adminPaymentTypes";

function label(value: string | null | undefined) {
  return value
    ? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Not available";
}

function money(value: number | null | undefined) {
  return typeof value === "number"
    ? new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value)
    : "Not available";
}

function date(value: string | null | undefined) {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime())
    ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(parsed)
    : "Not available";
}

export default function RealAdminPaymentDetailsModal({
  paymentId,
  onClose,
  onUpdated,
}: {
  paymentId: number | null;
  onClose: () => void;
  onUpdated: (payment: AdminPaymentDetails) => void;
}) {
  const token = getAuthToken();
  const [payment, setPayment] = useState<AdminPaymentDetails | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (paymentId === null) {
      return;
    }

    const controller = new AbortController();

    if (!token) {
      return () => controller.abort();
    }

    void getAdminPayment(token, paymentId)
      .then((response) => setPayment(response.payment))
      .catch((requestError) => {
        if (requestError instanceof Error && requestError.name === "AbortError") return;
        setError(getAdminPaymentsErrorMessage(requestError));
      })
      .finally(() => undefined);

    return () => controller.abort();
  }, [paymentId, token]);

  const changeStatus = async (status: string) => {
    const token = getAuthToken();
    if (!token || !payment) return;

    setSaving(true);
    setError(null);

    try {
      const response = await updateAdminPaymentStatus(token, payment.id, status);
      setPayment(response.payment);
      onUpdated(response.payment);
    } catch (requestError) {
      setError(getAdminPaymentsErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const canReview = payment?.allowed_statuses.length;
  const loading = paymentId !== null && Boolean(token) && !payment && !error;

  return (
    <BranchModalShell
      isOpen={paymentId !== null}
      eyebrow="Payment Oversight"
      title={payment?.order_reference ?? "Payment details"}
      description="Review the canonical payment record and supported verification action."
      titleId="admin-real-payment-title"
      descriptionId="admin-real-payment-description"
      status={payment ? <AdminBadge>{label(payment.status)}</AdminBadge> : null}
      onClose={onClose}
      footer={
        payment ? (
          <div className="flex w-full items-center justify-between gap-3">
            {canReview ? (
              <div className="flex flex-wrap gap-2">
                {payment.allowed_statuses.map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={saving}
                    onClick={() => void changeStatus(status)}
                    className={`admin-order-modal-button ${status === "failed" ? "admin-order-modal-button-danger" : "admin-order-modal-button-primary"}`}
                  >
                    <FontAwesomeIcon icon={status === "failed" ? faXmark : faCheck} aria-hidden="true" />
                    {status === "failed" ? "Mark Failed" : "Verify Payment"}
                  </button>
                ))}
              </div>
            ) : <span className="text-xs text-slate-500">No payment transition is available.</span>}
            <button type="button" onClick={onClose} className="admin-order-modal-button admin-order-modal-button-secondary">
              Close
            </button>
          </div>
        ) : null
      }
    >
      {loading ? <div className="px-2 py-12 text-center text-sm text-slate-500">Loading payment details...</div> : null}
      {error || (paymentId !== null && !token) ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error ?? "Your Admin session is unavailable. Please sign in again."}</div> : null}
      {payment ? (
        <div className="space-y-5">
          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title"><FontAwesomeIcon icon={faUser} aria-hidden="true" /><h3>Customer Information</h3></div>
            <dl className="admin-order-modal-detail-grid">
              <div><dt>Customer</dt><dd>{payment.customer?.full_name ?? "Guest customer"}</dd></div>
              <div><dt>Phone</dt><dd>{payment.customer?.contact_number || "Not available"}</dd></div>
              <div><dt>Email</dt><dd>{payment.customer?.email || "Not available"}</dd></div>
              <div><dt>Branch</dt><dd>{payment.branch?.name ?? "Not assigned"}</dd></div>
            </dl>
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title"><FontAwesomeIcon icon={faCreditCard} aria-hidden="true" /><h3>Payment Information</h3></div>
            <dl className="admin-order-modal-detail-grid admin-order-modal-order-grid">
              <div><dt>Method</dt><dd>{label(payment.method)}</dd></div>
              <div><dt>Status</dt><dd><AdminBadge>{label(payment.status)}</AdminBadge></dd></div>
              <div><dt>Amount</dt><dd className="admin-order-modal-total">{money(payment.amount)}</dd></div>
              <div><dt>Reference</dt><dd>{payment.reference || "Not available"}</dd></div>
              <div><dt>Submitted</dt><dd>{date(payment.created_at)}</dd></div>
              <div><dt>Reviewed</dt><dd>{payment.verified_by?.name ? `${payment.verified_by.name} · ${date(payment.verified_at)}` : "Not reviewed"}</dd></div>
            </dl>
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title"><FontAwesomeIcon icon={faImage} aria-hidden="true" /><h3>Proof of Payment</h3></div>
            {payment.proof_image_url ? (
              <a href={payment.proof_image_url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <img src={payment.proof_image_url} alt="Uploaded payment proof" className="max-h-80 w-full object-contain" />
              </a>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm text-slate-500">
                {payment.method === "pay_at_pickup" ? "Pay at Pickup does not require payment proof." : "No payment proof is attached to this record."}
              </div>
            )}
          </section>

          {payment.order ? (
            <section className="admin-order-modal-section">
              <div className="admin-order-modal-section-title"><FontAwesomeIcon icon={payment.order.fulfillment_method === "pickup" ? faStore : faTruck} aria-hidden="true" /><h3>Order Information</h3></div>
              <dl className="admin-order-modal-detail-grid admin-order-modal-order-grid">
                <div><dt>Order status</dt><dd><AdminBadge>{label(payment.order.status)}</AdminBadge></dd></div>
                <div><dt>Fulfillment</dt><dd>{label(payment.order.fulfillment_method)}</dd></div>
                <div><dt>Order total</dt><dd className="admin-order-modal-total">{money(payment.order.total_amount)}</dd></div>
                <div><dt>Delivery fee</dt><dd>{money(payment.order.delivery_fee)}</dd></div>
              </dl>
              <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
                <table className="admin-order-items-table min-w-full">
                  <thead><tr><th scope="col">Product</th><th scope="col">Qty</th><th scope="col">Unit price</th><th scope="col">Subtotal</th></tr></thead>
                  <tbody>{payment.order.items.map((item) => <tr key={`${item.product_id}-${item.name}`}><td><span className="flex items-center gap-2"><FontAwesomeIcon icon={faBoxOpen} aria-hidden="true" /><span>{item.name}</span></span></td><td>{item.quantity}</td><td>{money(item.unit_price)}</td><td>{money(item.line_total)}</td></tr>)}</tbody>
                </table>
              </div>
            </section>
          ) : null}

          {canReview ? (
            <section className="admin-order-modal-section">
              <div className="admin-order-modal-section-title"><FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" /><h3>Review Boundary</h3></div>
              <p className="text-sm leading-6 text-slate-600">Only the server can authorize this transition and set the reviewer identity and timestamp. Order status remains separate from payment status.</p>
            </section>
          ) : null}
        </div>
      ) : null}
    </BranchModalShell>
  );
}
