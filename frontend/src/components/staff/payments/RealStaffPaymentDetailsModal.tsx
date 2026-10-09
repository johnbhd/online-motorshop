"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faCreditCard,
  faFileLines,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { getAuthToken } from "@/lib/auth/authStorage";
import { toStatusLabel } from "@/lib/orders/orderAdapter";
import { getPaymentMethodLabel } from "@/lib/orders/orderRequestTypes";
import { Badge } from "@/components/staff/PortalTable";
import {
  getStaffPayment,
  getStaffPaymentsErrorMessage,
  updateStaffPaymentStatus,
} from "./staffPaymentsApi";
import type { StaffPaymentDetails } from "./staffPaymentsTypes";

type RealStaffPaymentDetailsModalProps = {
  isOpen: boolean;
  paymentId: number | null;
  onClose: () => void;
  onUpdated: (payment: StaffPaymentDetails) => void;
};

const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatPeso(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? pesoFormatter.format(value)
    : "Not available";
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "Not available" : dateFormatter.format(date);
}

function displayValue(value?: string | null) {
  return value || "Not available";
}

export default function RealStaffPaymentDetailsModal({
  isOpen,
  paymentId,
  onClose,
  onUpdated,
}: RealStaffPaymentDetailsModalProps) {
  const { user } = useAuth();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [payment, setPayment] = useState<StaffPaymentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!isOpen || paymentId === null || user?.role !== "staff") {
      return;
    }

    const token = getAuthToken();
    const controller = new AbortController();

    if (!token) {
      const errorTimeout = window.setTimeout(() => {
        setError("Your Staff session has expired. Please sign in again.");
      });

      return () => {
        window.clearTimeout(errorTimeout);
        controller.abort();
      };
    }

    const loadTimeout = window.setTimeout(() => {
      setPayment(null);
      setError(null);
      setUpdateError(null);
      setIsLoading(true);

      void getStaffPayment(token, paymentId, controller.signal)
        .then((result) => {
          setPayment(result.payment);
        })
        .catch((requestError) => {
          if (
            requestError instanceof DOMException &&
            requestError.name === "AbortError"
          ) {
            return;
          }

          setError(
            getStaffPaymentsErrorMessage(
              requestError,
              "This Staff payment could not be loaded.",
            ),
          );
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsLoading(false);
          }
        });
    });

    return () => {
      window.clearTimeout(loadTimeout);
      controller.abort();
    };
  }, [isOpen, paymentId, user?.role]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousActiveElement = document.activeElement as HTMLElement | null;
    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      previousActiveElement?.focus();
    };
  }, [isOpen, onClose]);

  async function handleStatusUpdate(status: string) {
    if (!payment || isUpdating) {
      return;
    }

    const token = getAuthToken();

    if (!token) {
      setUpdateError("Your Staff session has expired. Please sign in again.");
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const result = await updateStaffPaymentStatus(
        token,
        payment.id,
        status,
      );

      setPayment(result.payment);
      onUpdated(result.payment);
    } catch (requestError) {
      setUpdateError(
        getStaffPaymentsErrorMessage(
          requestError,
          "The payment status could not be updated.",
        ),
      );
    } finally {
      setIsUpdating(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
      <button
        className="absolute inset-0 cursor-default"
        type="button"
        aria-label="Close payment details"
        onClick={onClose}
      />

      <section
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-payment-modal-title"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
              Payment Details
            </p>
            <h2 id="staff-payment-modal-title" className="mt-1 text-xl font-bold text-[#0B1930]">
              {payment?.order_reference ?? "Payment"}
            </h2>
            {payment ? (
              <p className="mt-1 text-sm text-slate-500">
                Submitted {formatDate(payment.created_at)}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            {payment ? <Badge>{toStatusLabel(payment.status)}</Badge> : null}
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Close payment details"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#0B1930]"
            >
              <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="overflow-y-auto px-6 py-6">
          {isLoading ? (
            <div className="space-y-3 py-10" aria-live="polite" aria-busy="true">
              <div className="h-6 animate-pulse rounded bg-slate-100" />
              <div className="h-24 animate-pulse rounded bg-slate-100" />
              <div className="h-32 animate-pulse rounded bg-slate-100" />
              <span className="sr-only">Loading payment details</span>
            </div>
          ) : error ? (
            <div className="py-14 text-center" role="alert">
              <p className="font-semibold text-[#0B1930]">Unable to load payment details</p>
              <p className="mt-2 text-sm text-slate-500">{error}</p>
            </div>
          ) : payment ? (
            <div className="space-y-6">
              <section>
                <div className="mb-4 flex items-center gap-2 text-[#0B1930]">
                  <FontAwesomeIcon icon={faUser} aria-hidden="true" />
                  <h3 className="font-semibold">Customer Information</h3>
                </div>
                <dl className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">Customer</dt>
                    <dd className="mt-1 font-semibold text-[#0B1930]">{displayValue(payment.customer?.full_name)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Contact Number</dt>
                    <dd className="mt-1 text-slate-700">{displayValue(payment.customer?.contact_number)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Email</dt>
                    <dd className="mt-1 text-slate-700">{displayValue(payment.customer?.email)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Branch</dt>
                    <dd className="mt-1 text-slate-700">{displayValue(payment.branch?.name)}</dd>
                  </div>
                </dl>
              </section>

              <section>
                <div className="mb-4 flex items-center gap-2 text-[#0B1930]">
                  <FontAwesomeIcon icon={faCreditCard} aria-hidden="true" />
                  <h3 className="font-semibold">Payment Information</h3>
                </div>
                <dl className="grid gap-4 rounded-lg border border-slate-200 p-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">Payment Status</dt>
                    <dd className="mt-1"><Badge>{toStatusLabel(payment.status)}</Badge></dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Payment Method</dt>
                    <dd className="mt-1 font-semibold text-[#0B1930]">{getPaymentMethodLabel(payment.method)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Amount</dt>
                    <dd className="mt-1 font-semibold text-[#0B1930]">{formatPeso(payment.amount)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Payment Reference</dt>
                    <dd className="mt-1 text-slate-700">{displayValue(payment.reference)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Verified By</dt>
                    <dd className="mt-1 text-slate-700">{displayValue(payment.verified_by?.name)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Verified At</dt>
                    <dd className="mt-1 text-slate-700">{formatDate(payment.verified_at)}</dd>
                  </div>
                </dl>
              </section>

              <section>
                <div className="mb-4 flex items-center gap-2 text-[#0B1930]">
                  <FontAwesomeIcon icon={faFileLines} aria-hidden="true" />
                  <h3 className="font-semibold">Order Information</h3>
                </div>
                {payment.order ? (
                  <div className="space-y-4 rounded-lg border border-slate-200 p-4">
                    <dl className="grid gap-4 text-sm sm:grid-cols-3">
                      <div>
                        <dt className="text-slate-500">Order Status</dt>
                        <dd className="mt-1"><Badge>{toStatusLabel(payment.order.status)}</Badge></dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Fulfillment</dt>
                        <dd className="mt-1 text-slate-700">{toStatusLabel(payment.order.fulfillment_method)}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Order Total</dt>
                        <dd className="mt-1 font-semibold text-[#0B1930]">{formatPeso(payment.order.total_amount)}</dd>
                      </div>
                    </dl>
                    {payment.order.items.length ? (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[520px] text-left text-sm">
                          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                              <th className="px-2 py-3" scope="col">Item</th>
                              <th className="px-2 py-3" scope="col">Qty</th>
                              <th className="px-2 py-3 text-right" scope="col">Unit Price</th>
                              <th className="px-2 py-3 text-right" scope="col">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {payment.order.items.map((item) => (
                              <tr key={`${item.product_id}-${item.name}`}>
                                <td className="px-2 py-3 text-slate-700">{item.name}</td>
                                <td className="px-2 py-3 text-slate-600">{item.quantity}</td>
                                <td className="px-2 py-3 text-right text-slate-600">{formatPeso(item.unit_price)}</td>
                                <td className="px-2 py-3 text-right font-semibold text-slate-700">{formatPeso(item.line_total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    The related order snapshot is not available.
                  </p>
                )}
              </section>

              <section>
                <div className="mb-4 flex items-center gap-2 text-[#0B1930]">
                  <FontAwesomeIcon icon={faCartShopping} aria-hidden="true" />
                  <h3 className="font-semibold">Payment Proof</h3>
                </div>
                {payment.proof_image_url ? (
                  <div className="space-y-3 rounded-lg border border-slate-200 p-4">
                    <img
                      src={payment.proof_image_url}
                      alt={`Payment proof for ${payment.order_reference ?? "this order"}`}
                      className="max-h-72 w-full rounded-lg object-contain"
                    />
                    <a
                      href={payment.proof_image_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-orange-600 underline"
                    >
                      Open persisted proof
                    </a>
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    No payment proof is stored on this payment record.
                  </p>
                )}
              </section>

              {payment.allowed_statuses.length ? (
                <section className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <h3 className="font-semibold text-[#0B1930]">Payment Review</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Choose a supported status transition. The backend records the authenticated Staff reviewer.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {payment.allowed_statuses.includes("paid") ? (
                      <button
                        type="button"
                        onClick={() => void handleStatusUpdate("paid")}
                        disabled={isUpdating}
                        className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isUpdating ? "Updating…" : "Verify Payment"}
                      </button>
                    ) : null}
                    {payment.allowed_statuses.includes("failed") ? (
                      <button
                        type="button"
                        onClick={() => void handleStatusUpdate("failed")}
                        disabled={isUpdating}
                        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Mark Failed
                      </button>
                    ) : null}
                  </div>
                  {updateError ? (
                    <p className="mt-3 text-sm text-red-700" role="alert">{updateError}</p>
                  ) : null}
                </section>
              ) : null}
            </div>
          ) : null}
        </div>

        <footer className="flex justify-end border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}
