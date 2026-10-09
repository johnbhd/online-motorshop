"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faCartShopping,
  faCheck,
  faCircleInfo,
  faCreditCard,
  faFileLines,
  faLocationDot,
  faStore,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { getAuthToken } from "@/lib/auth/authStorage";
import { toStatusLabel } from "@/lib/orders/orderAdapter";
import { getPaymentMethodLabel } from "@/lib/orders/orderRequestTypes";
import { Badge } from "@/components/staff/PortalTable";
import {
  getStaffPickup,
  getStaffPickupsErrorMessage,
  updateStaffPickupStatus,
} from "./staffPickupApi";
import type { StaffPickupDetails } from "./staffPickupTypes";

type RealStaffPickupDetailsModalProps = {
  isOpen: boolean;
  pickupId: number | null;
  onClose: () => void;
  onUpdated: (pickup: StaffPickupDetails) => void;
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

function actionLabel(status: string) {
  switch (status) {
    case "preparing":
      return "Start Preparing";
    case "ready_for_pickup":
      return "Mark Ready for Pickup";
    case "completed":
      return "Mark Completed";
    default:
      return `Move to ${toStatusLabel(status)}`;
  }
}

function actionDescription(status: string) {
  switch (status) {
    case "preparing":
      return "Confirm that Staff has started preparing this pickup order.";
    case "ready_for_pickup":
      return "Confirm that all order items have been prepared and the customer may collect the order.";
    case "completed":
      return "Confirm that the customer has collected the order.";
    default:
      return "Confirm this supported pickup status transition.";
  }
}

export default function RealStaffPickupDetailsModal({
  isOpen,
  pickupId,
  onClose,
  onUpdated,
}: RealStaffPickupDetailsModalProps) {
  const { user } = useAuth();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const confirmationButtonRef = useRef<HTMLButtonElement>(null);
  const [pickup, setPickup] = useState<StaffPickupDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmationStatus, setConfirmationStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || pickupId === null || user?.role !== "staff") {
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
      setPickup(null);
      setError(null);
      setUpdateError(null);
      setIsLoading(true);

      void getStaffPickup(token, pickupId, controller.signal)
        .then((result) => {
          setPickup(result.pickup_request);
        })
        .catch((requestError) => {
          if (
            requestError instanceof DOMException &&
            requestError.name === "AbortError"
          ) {
            return;
          }

          setError(
            getStaffPickupsErrorMessage(
              requestError,
              "This Staff pickup request could not be loaded.",
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
  }, [isOpen, pickupId, user?.role]);

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
        if (confirmationStatus) {
          setConfirmationStatus(null);
          return;
        }

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
  }, [confirmationStatus, isOpen, onClose]);

  useEffect(() => {
    if (!confirmationStatus) {
      return;
    }

    const focusFrame = window.requestAnimationFrame(() => {
      confirmationButtonRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(focusFrame);
  }, [confirmationStatus]);

  async function handleStatusUpdate(status: string) {
    if (!pickup || isUpdating) {
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
      const result = await updateStaffPickupStatus(token, pickup.id, status);

      setPickup(result.pickup_request);
      onUpdated(result.pickup_request);
      setConfirmationStatus(null);
    } catch (requestError) {
      setUpdateError(
        getStaffPickupsErrorMessage(
          requestError,
          "The pickup status could not be updated.",
        ),
      );
    } finally {
      setIsUpdating(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  const nextStatus = pickup?.allowed_statuses[0] ?? null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
      <button
        className="absolute inset-0 cursor-default"
        type="button"
        aria-label="Close pickup details"
        onClick={onClose}
      />

      <section
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-pickup-modal-title"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
              Pickup Details
            </p>
            <h2 id="staff-pickup-modal-title" className="mt-1 text-xl font-bold text-[#0B1930]">
              {pickup?.order_reference ?? "Pickup Request"}
            </h2>
            {pickup ? (
              <p className="mt-1 text-sm text-slate-500">
                Updated {formatDate(pickup.updated_at)}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            {pickup ? <Badge>{toStatusLabel(pickup.pickup_status)}</Badge> : null}
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Close pickup details"
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
              <span className="sr-only">Loading pickup details</span>
            </div>
          ) : error ? (
            <div className="py-14 text-center" role="alert">
              <p className="font-semibold text-[#0B1930]">Unable to load pickup details</p>
              <p className="mt-2 text-sm text-slate-500">{error}</p>
            </div>
          ) : pickup ? (
            <div className="space-y-6">
              <section>
                <div className="mb-4 flex items-center gap-2 text-[#0B1930]">
                  <FontAwesomeIcon icon={faUser} aria-hidden="true" />
                  <h3 className="font-semibold">Customer Information</h3>
                </div>
                <dl className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">Customer</dt>
                    <dd className="mt-1 font-semibold text-[#0B1930]">{displayValue(pickup.customer?.full_name)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Contact Number</dt>
                    <dd className="mt-1 text-slate-700">{displayValue(pickup.customer?.contact_number)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Email</dt>
                    <dd className="mt-1 text-slate-700">{displayValue(pickup.customer?.email)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Branch</dt>
                    <dd className="mt-1 text-slate-700">{displayValue(pickup.branch?.name)}</dd>
                  </div>
                </dl>
              </section>

              <section>
                <div className="mb-4 flex items-center gap-2 text-[#0B1930]">
                  <FontAwesomeIcon icon={faFileLines} aria-hidden="true" />
                  <h3 className="font-semibold">Order Information</h3>
                </div>
                <dl className="grid gap-4 rounded-lg border border-slate-200 p-4 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-slate-500">Order Reference</dt>
                    <dd className="mt-1 font-semibold text-[#0B1930]">{displayValue(pickup.order_reference)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Order Status</dt>
                    <dd className="mt-1"><Badge>{toStatusLabel(pickup.order_status ?? "unknown")}</Badge></dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Order Total</dt>
                    <dd className="mt-1 font-semibold text-[#0B1930]">{formatPeso(pickup.amount)}</dd>
                  </div>
                </dl>
              </section>

              <section>
                <div className="mb-4 flex items-center gap-2 text-[#0B1930]">
                  <FontAwesomeIcon icon={faCartShopping} aria-hidden="true" />
                  <h3 className="font-semibold">Order Items</h3>
                </div>
                {pickup.order?.items.length ? (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full min-w-[560px] text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-3" scope="col">Product</th>
                          <th className="px-4 py-3" scope="col">Qty</th>
                          <th className="px-4 py-3 text-right" scope="col">Unit Price</th>
                          <th className="px-4 py-3 text-right" scope="col">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pickup.order.items.map((item) => (
                          <tr key={`${item.product_id}-${item.name}`}>
                            <td className="px-4 py-3 text-slate-700">
                              <span className="block font-medium">{item.name}</span>
                              {item.part_number ? <span className="text-xs text-slate-400">{item.part_number}</span> : null}
                            </td>
                            <td className="px-4 py-3 text-slate-600">{item.quantity}</td>
                            <td className="px-4 py-3 text-right text-slate-600">{formatPeso(item.unit_price)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-700">{formatPeso(item.line_total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    Item snapshots are not available in the current order record.
                  </p>
                )}
              </section>

              <section>
                <div className="mb-4 flex items-center gap-2 text-[#0B1930]">
                  <FontAwesomeIcon icon={faStore} aria-hidden="true" />
                  <h3 className="font-semibold">Pickup Information</h3>
                </div>
                <dl className="grid gap-4 rounded-lg border border-slate-200 p-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">Pickup Branch</dt>
                    <dd className="mt-1 text-slate-700">{displayValue(pickup.branch?.name)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Pickup Status</dt>
                    <dd className="mt-1"><Badge>{toStatusLabel(pickup.pickup_status)}</Badge></dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Pickup Date</dt>
                    <dd className="mt-1 text-slate-700">{displayValue(pickup.pickup_date)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Pickup Time</dt>
                    <dd className="mt-1 text-slate-700">{displayValue(pickup.pickup_time)}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-slate-500">Remarks</dt>
                    <dd className="mt-1 text-slate-700">{displayValue(pickup.remarks)}</dd>
                  </div>
                </dl>
                <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500">
                  <FontAwesomeIcon icon={faLocationDot} className="mt-0.5 shrink-0 text-orange-500" aria-hidden="true" />
                  Only pickup date, time, remarks, and completion timestamps persisted by Laravel are shown.
                </p>
              </section>

              <section>
                <div className="mb-4 flex items-center gap-2 text-[#0B1930]">
                  <FontAwesomeIcon icon={faCreditCard} aria-hidden="true" />
                  <h3 className="font-semibold">Payment Information</h3>
                </div>
                <dl className="grid gap-4 rounded-lg border border-slate-200 p-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">Payment Status</dt>
                    <dd className="mt-1"><Badge>{pickup.payment ? toStatusLabel(pickup.payment.status) : "No payment"}</Badge></dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Payment Method</dt>
                    <dd className="mt-1 text-slate-700">
                      {pickup.payment
                        ? getPaymentMethodLabel(pickup.payment.method)
                        : "Not available"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Payment Reference</dt>
                    <dd className="mt-1 text-slate-700">{displayValue(pickup.payment?.reference)}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-xs leading-5 text-slate-500">
                  Pickup actions do not verify or mutate payment records. Pay at Pickup remains unpaid until the separate payment workflow records otherwise.
                </p>
              </section>

              {nextStatus ? (
                <section className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <div className="flex items-start gap-3">
                    <FontAwesomeIcon icon={nextStatus === "completed" ? faCheck : faBoxOpen} className="mt-1 text-orange-600" aria-hidden="true" />
                    <div>
                      <h3 className="font-semibold text-[#0B1930]">Next Staff action</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {actionDescription(nextStatus)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmationStatus(nextStatus)}
                    disabled={isUpdating}
                    className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUpdating ? "Updating…" : actionLabel(nextStatus)}
                  </button>
                  {updateError ? <p className="mt-3 text-sm text-red-700" role="alert">{updateError}</p> : null}
                </section>
              ) : (
                <p className="flex items-start gap-2 text-xs leading-5 text-slate-500">
                  <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5 shrink-0 text-orange-500" aria-hidden="true" />
                  This pickup request is read-only at its current terminal status.
                </p>
              )}
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

      {confirmationStatus ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/40 p-4">
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="staff-pickup-confirmation-title"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-600">
                <FontAwesomeIcon icon={confirmationStatus === "completed" ? faCheck : faBoxOpen} aria-hidden="true" />
              </span>
              <div>
                <h3 id="staff-pickup-confirmation-title" className="font-semibold text-[#0B1930]">
                  {actionLabel(confirmationStatus)}?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {actionDescription(confirmationStatus)}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                type="button"
                onClick={() => setConfirmationStatus(null)}
              >
                Cancel
              </button>
              <button
                ref={confirmationButtonRef}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={isUpdating}
                onClick={() => void handleStatusUpdate(confirmationStatus)}
              >
                {isUpdating ? "Updating…" : actionLabel(confirmationStatus)}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
