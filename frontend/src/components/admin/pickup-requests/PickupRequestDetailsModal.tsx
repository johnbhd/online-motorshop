"use client";

import { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faCartShopping,
  faCheck,
  faCircleDot,
  faCircleInfo,
  faFileLines,
  faStore,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { formatPeso } from "@/components/user/cart/cartData";
import { AdminBadge } from "@/components/admin/AdminDataTable";
import {
  adminStaff,
  type AdminOrder,
  type AdminPickup,
} from "@/lib/mock/admin";
import { getAdminOrderDetails } from "@/components/admin/orders/orderDetails";

export type PickupModalMode = "review" | "view";

export type PickupRequestDetailsModalProps = {
  isOpen: boolean;
  mode: PickupModalMode;
  pickupRequest: AdminPickup | null;
  onClose: () => void;
  onAssignStaff?: (orderId: string, staff: string) => void;
  onMarkReady?: (orderId: string) => void;
  onCancel?: (orderId: string) => void;
};

const staffOptions = [
  "Unassigned",
  "—",
  ...adminStaff.map((staffMember) => staffMember.name),
];

function formatPickupAmount(value: string) {
  if (value === "—") {
    return "Not available";
  }

  const numericValue = Number(value.replace(/[^0-9.]/g, ""));

  return Number.isFinite(numericValue)
    ? formatPeso(numericValue)
    : "Not available";
}

function getRelatedOrder(pickupRequest: AdminPickup): AdminOrder {
  return {
    reference: pickupRequest.order,
    customer: pickupRequest.customer,
    branch: pickupRequest.branch,
    amount: pickupRequest.amount,
    fulfillment: "Store Pickup",
    staff: pickupRequest.staff,
    status: pickupRequest.status,
    updated: pickupRequest.schedule,
    action: "View",
  };
}

export default function PickupRequestDetailsModal({
  isOpen,
  mode,
  pickupRequest,
  onClose,
  onAssignStaff,
  onMarkReady,
  onCancel,
}: PickupRequestDetailsModalProps) {
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

  if (!isOpen || !pickupRequest) {
    return null;
  }

  const relatedOrder = getRelatedOrder(pickupRequest);
  const details = getAdminOrderDetails(relatedOrder);
  const isReviewMode = mode === "review";

  const closeModal = () => {
    onClose();
  };

  const handleAssignStaff = (staff: string) => {
    onAssignStaff?.(pickupRequest.order, staff);
  };

  const handleMarkReady = () => {
    onMarkReady?.(pickupRequest.order);
  };

  const handleCancel = () => {
    onCancel?.(pickupRequest.order);
  };

  return (
    <div className="admin-order-modal-overlay">
      <button
        className="admin-order-modal-backdrop"
        type="button"
        aria-label="Close pickup request details"
        onClick={closeModal}
      />

      <section
        className="admin-order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-pickup-modal-title"
        aria-describedby="admin-pickup-modal-description"
      >
        <header className="admin-order-modal-header">
          <div className="admin-order-modal-heading">
            <p>Pickup Request Details</p>
            <h2 id="admin-pickup-modal-title">{pickupRequest.order}</h2>
            <span id="admin-pickup-modal-description">
              {isReviewMode ? "Review pickup request" : "View pickup request"}
            </span>
          </div>

          <div className="admin-order-modal-header-meta">
            <AdminBadge>{pickupRequest.status}</AdminBadge>
            <span>Schedule {pickupRequest.schedule}</span>
            <button
              ref={closeButtonRef}
              className="admin-order-modal-close"
              type="button"
              aria-label="Close pickup request details"
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
                <dd>{pickupRequest.customer}</dd>
              </div>
              {details.customerPhone ? (
                <div>
                  <dt>Phone</dt>
                  <dd>{details.customerPhone}</dd>
                </div>
              ) : null}
              {details.customerEmail ? (
                <div>
                  <dt>Email</dt>
                  <dd>{details.customerEmail}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faFileLines} aria-hidden="true" />
              <h3>Order Information</h3>
            </div>
            <dl className="admin-order-modal-detail-grid admin-order-modal-order-grid">
              <div>
                <dt>Order Reference</dt>
                <dd>{pickupRequest.order}</dd>
              </div>
              <div>
                <dt>Branch</dt>
                <dd>{pickupRequest.branch}</dd>
              </div>
              <div>
                <dt>Payment</dt>
                <dd>{pickupRequest.payment}</dd>
              </div>
              <div>
                <dt>Order Total</dt>
                <dd className="admin-order-modal-total">
                  {formatPickupAmount(pickupRequest.amount)}
                </dd>
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
                    <td>{formatPickupAmount(pickupRequest.amount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faStore} aria-hidden="true" />
              <h3>Pickup Information</h3>
            </div>
            <dl className="admin-order-modal-detail-grid admin-order-modal-order-grid">
              <div>
                <dt>Pickup Branch</dt>
                <dd>{pickupRequest.branch}</dd>
              </div>
              <div>
                <dt>Pickup Schedule</dt>
                <dd>{pickupRequest.schedule}</dd>
              </div>
              <div>
                <dt>Pickup Person</dt>
                <dd>{pickupRequest.customer}</dd>
              </div>
              {details.customerPhone ? (
                <div>
                  <dt>Contact Number</dt>
                  <dd>{details.customerPhone}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faCircleDot} aria-hidden="true" />
              <h3>Pickup Status</h3>
            </div>
            <div className="admin-order-modal-control-grid">
              <div className="admin-order-modal-field">
                <span>Status</span>
                <AdminBadge>{pickupRequest.status}</AdminBadge>
              </div>
              {isReviewMode ? (
                <label className="admin-order-modal-field">
                  <span>Assigned Staff</span>
                  <select
                    value={
                      staffOptions.includes(pickupRequest.staff)
                        ? pickupRequest.staff
                        : staffOptions[0]
                    }
                    onChange={(event) => handleAssignStaff(event.target.value)}
                  >
                    {staffOptions.map((staffMember) => (
                      <option key={staffMember} value={staffMember}>
                        {staffMember}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="admin-order-modal-field">
                  <span>Assigned Staff</span>
                  <strong>{pickupRequest.staff}</strong>
                </div>
              )}
            </div>
          </section>

          {isReviewMode ? (
            <div className="admin-order-review-notice">
              <FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" />
              <p>
                <strong>Prepare this pickup request before marking it ready.</strong>
                <span>
                  Confirm the assigned staff and pickup details before the
                  customer is notified.
                </span>
              </p>
            </div>
          ) : null}
        </div>

        <footer className="admin-order-modal-footer">
          {isReviewMode ? (
            <button
              className="admin-order-modal-button admin-order-modal-button-danger"
              type="button"
              onClick={handleCancel}
            >
              <FontAwesomeIcon icon={faBan} aria-hidden="true" />
              Cancel Request
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
            {isReviewMode ? (
              <button
                className="admin-order-modal-button admin-order-modal-button-primary"
                type="button"
                onClick={handleMarkReady}
              >
                <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
                Mark Ready for Pickup
              </button>
            ) : null}
          </div>
        </footer>
      </section>
    </div>
  );
}
