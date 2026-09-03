"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faCartShopping,
  faCheck,
  faCircleDot,
  faCircleInfo,
  faFileLines,
  faStore,
  faTruck,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { adminStaff, type AdminOrder } from "@/lib/mock/admin";
import { AdminBadge } from "@/components/admin/AdminDataTable";
import {
  adminOrderStatuses,
  getAdminOrderDetails,
  type OrderUpdateDraft,
} from "./orderDetails";

export type OrderModalMode = "review" | "view";

export type OrderDetailsModalProps = {
  isOpen: boolean;
  mode: OrderModalMode;
  order: AdminOrder | null;
  onClose: () => void;
  onConfirm?: (orderId: string) => void;
  onReject?: (orderId: string) => void;
  onSave?: (orderId: string, changes: OrderUpdateDraft) => void;
};

const staffOptions = [
  "Unassigned",
  ...adminStaff.map((staffMember) => staffMember.name),
];

const pickupStatusOptions = [
  "Pending",
  "Preparing",
  "Ready for Pickup",
  "Completed",
  "Cancelled",
];

const bookingStatusOptions = [
  "Waiting for Booking",
  "In Transit",
  "Completed",
  "Cancelled",
];

const riderStatusOptions = [
  "Not assigned",
  "Rider assigned",
  "Picked up",
  "In transit",
  "Delivered",
  "Cancelled",
];

const branchOptions = ["Manila", "Makati", "Imus"];
const finalOrderStatuses = new Set(["Completed", "Cancelled"]);
const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

function formatPeso(value: string | number) {
  const numericValue =
    typeof value === "number"
      ? value
      : Number(value.replace(/[^0-9.]/g, ""));

  return Number.isFinite(numericValue)
    ? pesoFormatter.format(numericValue)
    : "Not available";
}

function getInitialDraft(order: AdminOrder): OrderUpdateDraft {
  const pickupStatus = pickupStatusOptions.includes(order.status)
    ? order.status
    : "Pending";
  const bookingStatus = bookingStatusOptions.includes(order.status)
    ? order.status
    : "Waiting for Booking";

  return {
    status: order.status,
    staff: order.staff,
    fulfillment: order.fulfillment,
    pickupBranch: order.branch,
    pickupStatus,
    pickupNotes: "",
    deliveryAddress: "",
    bookingStatus,
    riderStatus: "Not assigned",
    deliveryNotes: "",
  };
}

function getOptionValue(value: string, options: readonly string[]) {
  return options.includes(value) ? value : options[0];
}

export default function OrderDetailsModal({
  isOpen,
  mode,
  order,
  onClose,
  onConfirm,
  onReject,
  onSave,
}: OrderDetailsModalProps) {
  const [draft, setDraft] = useState<OrderUpdateDraft | null>(() =>
    order ? getInitialDraft(order) : null,
  );
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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

  if (!isOpen || !order || !draft) {
    return null;
  }

  const details = getAdminOrderDetails(order);
  const isFinalOrder = finalOrderStatuses.has(order.status);

  const updateDraft = (field: keyof OrderUpdateDraft, value: string) => {
    setDraft((currentDraft) =>
      currentDraft
        ? {
            ...currentDraft,
            [field]: value,
          }
        : currentDraft,
    );
  };

  const closeModal = () => {
    setDraft(null);
    onClose();
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(order.reference);
      return;
    }

    closeModal();
  };

  const handleReject = () => {
    if (onReject) {
      onReject(order.reference);
      return;
    }

    closeModal();
  };

  const handleSave = () => {
    if (onSave) {
      onSave(order.reference, draft);
      return;
    }

    closeModal();
  };

  return (
    <div className="admin-order-modal-overlay">
      <button
        className="admin-order-modal-backdrop"
        type="button"
        aria-label="Close order details"
        onClick={closeModal}
      />

      <section
        className="admin-order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-order-modal-title"
        aria-describedby="admin-order-modal-description"
      >
        <header className="admin-order-modal-header">
          <div className="admin-order-modal-heading">
            <p>Order Details</p>
            <h2 id="admin-order-modal-title">{order.reference}</h2>
            <span id="admin-order-modal-description">
              {mode === "review" ? "Review order" : "View order"}
            </span>
          </div>

          <div className="admin-order-modal-header-meta">
            <AdminBadge>{order.status}</AdminBadge>
            <span>Placed {order.updated}</span>
            <button
              ref={closeButtonRef}
              className="admin-order-modal-close"
              type="button"
              aria-label="Close order details"
              onClick={closeModal}
            >
              <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="admin-order-modal-body">
          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faUser} aria-hidden="true" />
              <h3>Customer Information</h3>
            </div>
            <dl className="admin-order-modal-detail-grid">
              <div>
                <dt>Customer</dt>
                <dd>{order.customer}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{details.customerPhone ?? "Not available"}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{details.customerEmail ?? "Not available"}</dd>
              </div>
            </dl>
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faFileLines} aria-hidden="true" />
              <h3>Order Information</h3>
            </div>
            <dl className="admin-order-modal-detail-grid admin-order-modal-order-grid">
              <div>
                <dt>Branch</dt>
                <dd>{order.branch}</dd>
              </div>
              <div>
                <dt>Fulfillment</dt>
                <dd>{order.fulfillment}</dd>
              </div>
              <div>
                <dt>Assigned Staff</dt>
                <dd>{order.staff}</dd>
              </div>
              <div>
                <dt>Order Total</dt>
                <dd className="admin-order-modal-total">{formatPeso(order.amount)}</dd>
              </div>
            </dl>
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faCartShopping} aria-hidden="true" />
              <h3>Order Items</h3>
            </div>
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
                  {details.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>{formatPeso(item.price)}</td>
                      <td>{formatPeso(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row" colSpan={3}>
                      Total
                    </th>
                    <td>{formatPeso(order.amount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faCircleDot} aria-hidden="true" />
              <h3>Order Status</h3>
            </div>
            <div className="admin-order-modal-control-grid">
              <label className="admin-order-modal-field">
                <span>Status</span>
                <select
                  value={draft.status}
                  disabled={isFinalOrder}
                  onChange={(event) => updateDraft("status", event.target.value)}
                >
                  {adminOrderStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-order-modal-field">
                <span>Assigned Staff</span>
                <select
                  value={getOptionValue(draft.staff, staffOptions)}
                  disabled={isFinalOrder}
                  onChange={(event) => updateDraft("staff", event.target.value)}
                >
                  {staffOptions.map((staffMember) => (
                    <option key={staffMember} value={staffMember}>
                      {staffMember}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-order-modal-field">
                <span>Fulfillment</span>
                <select
                  value={draft.fulfillment}
                  disabled={isFinalOrder}
                  onChange={(event) =>
                    updateDraft("fulfillment", event.target.value)
                  }
                >
                  <option value="Store Pickup">Store Pickup</option>
                  <option value="Lalamove Delivery">Lalamove Delivery</option>
                </select>
              </label>
            </div>
          </section>

          {draft.fulfillment === "Store Pickup" ? (
            <section className="admin-order-modal-section">
              <div className="admin-order-modal-section-title">
                <FontAwesomeIcon icon={faStore} aria-hidden="true" />
                <h3>Store Pickup Details</h3>
              </div>
              <div className="admin-order-modal-control-grid">
                <label className="admin-order-modal-field">
                  <span>Pickup Branch</span>
                  <select
                    value={getOptionValue(draft.pickupBranch, branchOptions)}
                    disabled={isFinalOrder}
                    onChange={(event) =>
                      updateDraft("pickupBranch", event.target.value)
                    }
                  >
                    {branchOptions.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="admin-order-modal-field">
                  <span>Pickup Status</span>
                  <select
                    value={getOptionValue(draft.pickupStatus, pickupStatusOptions)}
                    disabled={isFinalOrder}
                    onChange={(event) =>
                      updateDraft("pickupStatus", event.target.value)
                    }
                  >
                    {pickupStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="admin-order-modal-field admin-order-modal-field-full">
                <span>Notes (Optional)</span>
                <textarea
                  value={draft.pickupNotes}
                  maxLength={120}
                  rows={3}
                  disabled={isFinalOrder}
                  onChange={(event) =>
                    updateDraft("pickupNotes", event.target.value)
                  }
                />
                <small>{draft.pickupNotes.length} / 120</small>
              </label>
            </section>
          ) : (
            <section className="admin-order-modal-section">
              <div className="admin-order-modal-section-title">
                <FontAwesomeIcon icon={faTruck} aria-hidden="true" />
                <h3>Delivery Details</h3>
              </div>
              <label className="admin-order-modal-field admin-order-modal-field-full">
                <span>Delivery Address</span>
                <input
                  value={draft.deliveryAddress}
                  placeholder={details.deliveryAddress ?? "Not available"}
                  disabled={isFinalOrder}
                  onChange={(event) =>
                    updateDraft("deliveryAddress", event.target.value)
                  }
                />
              </label>
              <div className="admin-order-modal-control-grid">
                <label className="admin-order-modal-field">
                  <span>Booking Status</span>
                  <select
                    value={getOptionValue(draft.bookingStatus, bookingStatusOptions)}
                    disabled={isFinalOrder}
                    onChange={(event) =>
                      updateDraft("bookingStatus", event.target.value)
                    }
                  >
                    {bookingStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="admin-order-modal-field">
                  <span>Rider Status</span>
                  <select
                    value={getOptionValue(draft.riderStatus, riderStatusOptions)}
                    disabled={isFinalOrder}
                    onChange={(event) =>
                      updateDraft("riderStatus", event.target.value)
                    }
                  >
                    {riderStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="admin-order-modal-field admin-order-modal-field-full">
                <span>Notes (Optional)</span>
                <textarea
                  value={draft.deliveryNotes}
                  maxLength={120}
                  rows={3}
                  disabled={isFinalOrder}
                  onChange={(event) =>
                    updateDraft("deliveryNotes", event.target.value)
                  }
                />
                <small>{draft.deliveryNotes.length} / 120</small>
              </label>
            </section>
          )}

          {mode === "review" && !isFinalOrder ? (
            <div className="admin-order-review-notice">
              <FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" />
              <p>
                <strong>Review this order carefully before confirming.</strong>
                <span>You can reject the order if there are issues.</span>
              </p>
            </div>
          ) : null}
        </div>

        <footer className="admin-order-modal-footer">
          {mode === "review" && !isFinalOrder ? (
            <button
              className="admin-order-modal-button admin-order-modal-button-danger"
              type="button"
              onClick={handleReject}
            >
              <FontAwesomeIcon icon={faBan} aria-hidden="true" />
              Reject Order
            </button>
          ) : (
            <span />
          )}

          <div className="admin-order-modal-footer-actions">
            <button
              className="admin-order-modal-button admin-order-modal-button-secondary"
              type="button"
              onClick={closeModal}
            >
              Close
            </button>
            {mode === "review" && !isFinalOrder ? (
              <button
                className="admin-order-modal-button admin-order-modal-button-primary"
                type="button"
                onClick={handleConfirm}
              >
                <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
                Confirm Order
              </button>
            ) : mode === "view" && !isFinalOrder ? (
              <button
                className="admin-order-modal-button admin-order-modal-button-primary"
                type="button"
                onClick={handleSave}
              >
                <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
                Save Changes
              </button>
            ) : null}
          </div>
        </footer>
      </section>
    </div>
  );
}
