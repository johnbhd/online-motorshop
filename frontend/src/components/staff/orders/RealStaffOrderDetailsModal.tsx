"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faCircleDot,
  faCreditCard,
  faFileLines,
  faInfoCircle,
  faStore,
  faTruck,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { getAuthToken } from "@/lib/auth/authStorage";
import { toStatusLabel } from "@/lib/orders/orderAdapter";
import { Badge } from "@/components/staff/PortalTable";
import {
  getStaffOrder,
  getStaffOrdersErrorMessage,
  updateStaffOrderStatus,
} from "./staffOrdersApi";
import type { StaffOrderDetails } from "./staffOrdersTypes";

export type RealStaffOrderDetailsModalProps = {
  isOpen: boolean;
  reference: string | null;
  onClose: () => void;
  onStatusUpdated: (order: StaffOrderDetails) => void;
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

function displayValue(value?: string | null) {
  return value || "Not available";
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "Not available" : dateFormatter.format(date);
}

function fulfillmentLabel(value: string) {
  return value.toLowerCase() === "delivery"
    ? "Lalamove Delivery"
    : "Store Pickup";
}

export default function RealStaffOrderDetailsModal({
  isOpen,
  reference,
  onClose,
  onStatusUpdated,
}: RealStaffOrderDetailsModalProps) {
  const { user } = useAuth();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [order, setOrder] = useState<StaffOrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !reference || user?.role !== "staff") {
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
      setOrder(null);
      setError(null);
      setUpdateError(null);
      setIsLoading(true);

      void getStaffOrder(token, reference, controller.signal)
        .then((result) => {
          setOrder(result.order);
          setSelectedStatus(result.order.allowed_statuses[0] ?? "");
        })
        .catch((requestError) => {
          if (
            requestError instanceof DOMException &&
            requestError.name === "AbortError"
          ) {
            return;
          }

          setError(
            getStaffOrdersErrorMessage(
              requestError,
              "This Staff order could not be loaded.",
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
  }, [isOpen, reference, user?.role]);

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

  async function handleStatusUpdate() {
    if (!order || !selectedStatus || isUpdating) {
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
      const result = await updateStaffOrderStatus(
        token,
        order.reference,
        selectedStatus,
      );

      setOrder(result.order);
      setSelectedStatus(result.order.allowed_statuses[0] ?? "");
      onStatusUpdated(result.order);
    } catch (requestError) {
      setUpdateError(
        getStaffOrdersErrorMessage(
          requestError,
          "The order status could not be updated.",
        ),
      );
    } finally {
      setIsUpdating(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  const isPickup = order?.fulfillment_method.toLowerCase() !== "delivery";

  return (
    <div className="admin-order-modal-overlay">
      <button
        className="admin-order-modal-backdrop"
        type="button"
        aria-label="Close order details"
        onClick={onClose}
      />

      <section
        className="admin-order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-order-modal-title"
        aria-describedby="staff-order-modal-description"
      >
        <header className="admin-order-modal-header">
          <div className="admin-order-modal-heading">
            <p>Order Details</p>
            <h2 id="staff-order-modal-title">{reference}</h2>
            <span id="staff-order-modal-description">Real Staff order view</span>
          </div>

          <div className="admin-order-modal-header-meta">
            {order ? <Badge>{toStatusLabel(order.status)}</Badge> : null}
            {order ? <span>Placed {formatDate(order.created_at)}</span> : null}
            <button
              ref={closeButtonRef}
              className="admin-order-modal-close"
              type="button"
              aria-label="Close order details"
              onClick={onClose}
            >
              <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="admin-order-modal-body">
          {isLoading ? (
            <div className="space-y-3 px-2 py-10" aria-live="polite" aria-busy="true">
              <div className="h-5 animate-pulse rounded bg-slate-100" />
              <div className="h-20 animate-pulse rounded bg-slate-100" />
              <div className="h-20 animate-pulse rounded bg-slate-100" />
              <span className="sr-only">Loading order details</span>
            </div>
          ) : error ? (
            <div className="px-2 py-14 text-center" role="alert">
              <p className="font-semibold text-[#0B1930]">Unable to load order details</p>
              <p className="mt-2 text-sm text-slate-500">{error}</p>
            </div>
          ) : order ? (
            <>
              <section className="admin-order-modal-section">
                <div className="admin-order-modal-section-title">
                  <FontAwesomeIcon icon={faUser} aria-hidden="true" />
                  <h3>Customer Information</h3>
                </div>
                <dl className="admin-order-modal-detail-grid">
                  <div>
                    <dt>Customer</dt>
                    <dd>{displayValue(order.customer?.full_name)}</dd>
                  </div>
                  <div>
                    <dt>Contact Number</dt>
                    <dd>{displayValue(order.customer?.contact_number)}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{displayValue(order.customer?.email)}</dd>
                  </div>
                  <div>
                    <dt>Address</dt>
                    <dd>{displayValue(order.customer?.address)}</dd>
                  </div>
                </dl>
              </section>

              <section className="admin-order-modal-section">
                <div className="admin-order-modal-section-title">
                  <FontAwesomeIcon icon={faFileLines} aria-hidden="true" />
                  <h3>Order Information</h3>
                </div>
                <dl className="admin-order-modal-detail-grid">
                  <div>
                    <dt>Order Reference</dt>
                    <dd>{order.reference}</dd>
                  </div>
                  <div>
                    <dt>Order Date</dt>
                    <dd>{formatDate(order.created_at)}</dd>
                  </div>
                  <div>
                    <dt>Branch</dt>
                    <dd>{displayValue(order.branch?.name)}</dd>
                  </div>
                  <div>
                    <dt>Fulfillment</dt>
                    <dd>{fulfillmentLabel(order.fulfillment_method)}</dd>
                  </div>
                  <div>
                    <dt>Order Total</dt>
                    <dd className="admin-order-modal-total">{formatPeso(order.total_amount)}</dd>
                  </div>
                </dl>
              </section>

              <section className="admin-order-modal-section">
                <div className="admin-order-modal-section-title">
                  <FontAwesomeIcon icon={faCartShopping} aria-hidden="true" />
                  <h3>Order Items</h3>
                </div>
                {order.items.length ? (
                  <div className="admin-order-items-table-wrap">
                    <table className="admin-order-items-table">
                      <thead>
                        <tr>
                          <th scope="col">Product</th>
                          <th scope="col">Qty</th>
                          <th scope="col">Price</th>
                          <th scope="col">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item) => (
                          <tr key={`${item.product_id}-${item.name}`}>
                            <td>
                              {item.name}
                              {item.part_number ? (
                                <span className="block text-xs text-slate-400">{item.part_number}</span>
                              ) : null}
                            </td>
                            <td>{item.quantity}</td>
                            <td>{formatPeso(item.unit_price)}</td>
                            <td>{formatPeso(item.line_total)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <th scope="row" colSpan={3}>Total</th>
                          <td>{formatPeso(order.total_amount)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    No item snapshots are available.
                  </p>
                )}
              </section>

              <section className="admin-order-modal-section">
                <div className="admin-order-modal-section-title">
                  <FontAwesomeIcon icon={faCreditCard} aria-hidden="true" />
                  <h3>Payment Information</h3>
                </div>
                <dl className="admin-order-modal-detail-grid">
                  <div>
                    <dt>Payment Status</dt>
                    <dd><Badge>{toStatusLabel(order.payment_status)}</Badge></dd>
                  </div>
                  <div>
                    <dt>Payment Record</dt>
                    <dd>{order.payment ? order.payment.method : "No payment record"}</dd>
                  </div>
                  <div>
                    <dt>Amount</dt>
                    <dd className="admin-order-modal-total">
                      {formatPeso(order.payment?.amount ?? order.total_amount)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-4 text-xs leading-5 text-slate-500">
                  Payment verification is outside Staff Order Management.
                </p>
              </section>

              <section className="admin-order-modal-section">
                <div className="admin-order-modal-section-title">
                  <FontAwesomeIcon icon={isPickup ? faStore : faTruck} aria-hidden="true" />
                  <h3>Fulfillment Information</h3>
                </div>
                <dl className="admin-order-modal-detail-grid">
                  <div>
                    <dt>Fulfillment</dt>
                    <dd>{fulfillmentLabel(order.fulfillment_method)}</dd>
                  </div>
                  <div>
                    <dt>Branch</dt>
                    <dd>{displayValue(order.branch?.name)}</dd>
                  </div>
                  {!isPickup ? (
                    <div>
                      <dt>Delivery Address</dt>
                      <dd>{displayValue(order.delivery?.address)}</dd>
                    </div>
                  ) : null}
                </dl>
                {isPickup ? (
                  <dl className="admin-order-modal-detail-grid mt-4">
                    <div>
                      <dt>Pickup Status</dt>
                      <dd>{toStatusLabel(order.pickup?.status ?? "not_available")}</dd>
                    </div>
                    <div>
                      <dt>Pickup Schedule</dt>
                      <dd>{displayValue(order.pickup?.pickup_date)}</dd>
                    </div>
                  </dl>
                ) : (
                  <dl className="admin-order-modal-detail-grid mt-4">
                    <div>
                      <dt>Delivery Status</dt>
                      <dd>{toStatusLabel(order.delivery?.status ?? "not_available")}</dd>
                    </div>
                    <div>
                      <dt>Delivery Fee</dt>
                      <dd>{formatPeso(order.delivery?.fee ?? order.delivery_fee)}</dd>
                    </div>
                  </dl>
                )}
              </section>

              <section className="admin-order-modal-section">
                <div className="admin-order-modal-section-title">
                  <FontAwesomeIcon icon={faCircleDot} aria-hidden="true" />
                  <h3>Order Status</h3>
                </div>
                <dl className="admin-order-modal-detail-grid">
                  <div>
                    <dt>Current Status</dt>
                    <dd><Badge>{toStatusLabel(order.status)}</Badge></dd>
                  </div>
                  <div>
                    <dt>Assigned Staff</dt>
                    <dd>{displayValue(order.assigned_staff?.name)}</dd>
                  </div>
                </dl>
                {order.allowed_statuses.length ? (
                  <div className="admin-order-modal-control-grid mt-5">
                    <label className="admin-order-modal-field" htmlFor="staff-order-status">
                      <span>Next review status</span>
                      <select
                        id="staff-order-status"
                        value={selectedStatus}
                        onChange={(event) => setSelectedStatus(event.target.value)}
                        disabled={isUpdating}
                      >
                        {order.allowed_statuses.map((allowedStatus) => (
                          <option key={allowedStatus} value={allowedStatus}>
                            {toStatusLabel(allowedStatus)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="flex items-end">
                      <button
                        className="admin-order-modal-button admin-order-modal-button-primary w-full"
                        type="button"
                        onClick={() => void handleStatusUpdate()}
                        disabled={isUpdating || !selectedStatus}
                      >
                        {isUpdating ? "Updating…" : "Update Status"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="admin-order-review-notice">
                    <FontAwesomeIcon icon={faInfoCircle} aria-hidden="true" />
                    <span>No further Staff review transition is available for this status.</span>
                  </p>
                )}
                {updateError ? (
                  <p className="mt-3 text-sm text-red-600" role="alert">{updateError}</p>
                ) : null}
              </section>
            </>
          ) : null}
        </div>

        <footer className="admin-order-modal-footer">
          <span>Staff order view</span>
          <button
            className="admin-order-modal-button admin-order-modal-button-secondary"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}
