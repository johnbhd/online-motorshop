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
  faLocationDot,
  faTruck,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { AdminBadge } from "@/components/admin/AdminDataTable";
import { formatPeso } from "@/components/user/cart/cartData";
import {
  adminStaff,
  type AdminDelivery,
  type AdminOrder,
} from "@/lib/mock/admin";
import { getAdminOrderDetails } from "@/components/admin/orders/orderDetails";

export type DeliveryModalMode = "review" | "view";

export type DeliveryRequestDetailsModalProps = {
  isOpen: boolean;
  mode: DeliveryModalMode;
  deliveryRequest: AdminDelivery | null;
  onClose: () => void;
  onAssignStaff?: (orderId: string, staff: string) => void;
  onMarkBooked?: (orderId: string) => void;
  onCancel?: (orderId: string) => void;
};

const staffOptions = [
  "Unassigned",
  "—",
  ...adminStaff.map((staffMember) => staffMember.name),
];

function formatDeliveryAmount(value: string) {
  if (value === "—") {
    return "Not available";
  }

  const numericValue = Number(value.replace(/[^0-9.]/g, ""));

  return Number.isFinite(numericValue)
    ? formatPeso(numericValue)
    : "Not available";
}

function formatDeliveryFee(value: string) {
  if (value === "—") {
    return "Not available";
  }

  if (value === "To be confirmed") {
    return value;
  }

  const numericValue = Number(value.replace(/[^0-9.]/g, ""));

  return Number.isFinite(numericValue)
    ? formatPeso(numericValue)
    : "Not available";
}

function getRelatedOrder(deliveryRequest: AdminDelivery): AdminOrder {
  return {
    reference: deliveryRequest.order,
    customer: deliveryRequest.customer,
    branch: deliveryRequest.branch,
    amount: deliveryRequest.amount,
    fulfillment: "Lalamove Delivery",
    staff: deliveryRequest.staff,
    status: deliveryRequest.status,
    updated: "Not available",
    action: "View",
  };
}

export default function DeliveryRequestDetailsModal({
  isOpen,
  mode,
  deliveryRequest,
  onClose,
  onAssignStaff,
  onMarkBooked,
  onCancel,
}: DeliveryRequestDetailsModalProps) {
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

  if (!isOpen || !deliveryRequest) {
    return null;
  }

  const relatedOrder = getRelatedOrder(deliveryRequest);
  const details = getAdminOrderDetails(relatedOrder);
  const isReviewMode = mode === "review";
  const canMarkBooked = deliveryRequest.status === "Waiting for Booking";
  const canCancel = isReviewMode && deliveryRequest.status !== "Cancelled";

  const closeModal = () => {
    onClose();
  };

  const handleAssignStaff = (staff: string) => {
    onAssignStaff?.(deliveryRequest.order, staff);
  };

  const handleMarkBooked = () => {
    onMarkBooked?.(deliveryRequest.order);
  };

  const handleCancel = () => {
    onCancel?.(deliveryRequest.order);
  };

  return (
    <div className="admin-order-modal-overlay">
      <button
        className="admin-order-modal-backdrop"
        type="button"
        aria-label="Close delivery request details"
        onClick={closeModal}
      />

      <section
        className="admin-order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-delivery-modal-title"
        aria-describedby="admin-delivery-modal-description"
      >
        <header className="admin-order-modal-header">
          <div className="admin-order-modal-heading">
            <p>Delivery Request Details</p>
            <h2 id="admin-delivery-modal-title">{deliveryRequest.order}</h2>
            <span id="admin-delivery-modal-description">
              {isReviewMode
                ? "Review delivery request"
                : "View delivery request"}
            </span>
          </div>

          <div className="admin-order-modal-header-meta">
            <AdminBadge>{deliveryRequest.status}</AdminBadge>
            <button
              ref={closeButtonRef}
              className="admin-order-modal-close"
              type="button"
              aria-label="Close delivery request details"
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
                <dd>{deliveryRequest.customer}</dd>
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
            <dl className="admin-order-modal-detail-grid">
              <div>
                <dt>Order Reference</dt>
                <dd>{deliveryRequest.order}</dd>
              </div>
              <div>
                <dt>Branch</dt>
                <dd>{deliveryRequest.branch}</dd>
              </div>
              <div>
                <dt>Order Total</dt>
                <dd className="admin-order-modal-total">
                  {formatDeliveryAmount(deliveryRequest.amount)}
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
                    <td>{formatDeliveryAmount(deliveryRequest.amount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faTruck} aria-hidden="true" />
              <h3>Delivery Information</h3>
            </div>
            <dl className="admin-order-modal-detail-grid">
              <div className="col-span-full">
                <dt>Delivery Address</dt>
                <dd>{deliveryRequest.destination}</dd>
              </div>
              <div>
                <dt>Customer / Recipient</dt>
                <dd>{deliveryRequest.customer}</dd>
              </div>
              <div>
                <dt>Contact Number</dt>
                <dd>{details.customerPhone ?? "Not available"}</dd>
              </div>
              <div>
                <dt>Branch</dt>
                <dd>{deliveryRequest.branch}</dd>
              </div>
            </dl>
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faLocationDot} aria-hidden="true" />
              <h3>Lalamove Booking</h3>
            </div>
            <dl className="admin-order-modal-detail-grid">
              <div>
                <dt>Lalamove Fee</dt>
                <dd>{formatDeliveryFee(deliveryRequest.fee)}</dd>
              </div>
              <div>
                <dt>Booking Reference</dt>
                <dd>Not recorded</dd>
              </div>
              <div>
                <dt>Current Delivery Stage</dt>
                <dd>{deliveryRequest.status}</dd>
              </div>
            </dl>
            <div className="admin-order-review-notice">
              <FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" />
              <p>
                <strong>Manual Lalamove booking</strong>
                <span>
                  Booking references, rider details, and live tracking are not
                  recorded in the current frontend data.
                </span>
              </p>
            </div>
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faCircleDot} aria-hidden="true" />
              <h3>Delivery Status</h3>
            </div>
            <div className="admin-order-modal-control-grid">
              <div className="admin-order-modal-field">
                <span>Status</span>
                <AdminBadge>{deliveryRequest.status}</AdminBadge>
              </div>
              {isReviewMode ? (
                <label className="admin-order-modal-field">
                  <span>Assigned Staff</span>
                  <select
                    value={
                      staffOptions.includes(deliveryRequest.staff)
                        ? deliveryRequest.staff
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
                  <strong>{deliveryRequest.staff}</strong>
                </div>
              )}
            </div>
          </section>

          {isReviewMode ? (
            <div className="admin-order-review-notice">
              <FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" />
              <p>
                <strong>
                  {canMarkBooked
                    ? "Confirm the manual booking before marking it booked."
                    : "Review the delivery request and current delivery state."}
                </strong>
                <span>
                  {canMarkBooked
                    ? "This action records the current frontend status only; it does not contact Lalamove."
                    : "No retry, rebooking, rider, or tracking action is available for this record."}
                </span>
              </p>
            </div>
          ) : null}
        </div>

        <footer className="admin-order-modal-footer">
          {canCancel ? (
            <button
              className="admin-order-modal-button admin-order-modal-button-danger"
              type="button"
              onClick={handleCancel}
            >
              <FontAwesomeIcon icon={faBan} aria-hidden="true" />
              Cancel Delivery Request
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
            {canMarkBooked ? (
              <button
                className="admin-order-modal-button admin-order-modal-button-primary"
                type="button"
                onClick={handleMarkBooked}
              >
                <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
                Mark as Booked
              </button>
            ) : null}
          </div>
        </footer>
      </section>
    </div>
  );
}
