"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faCheck,
  faCircleDot,
  faCircleInfo,
  faCreditCard,
  faFileLines,
  faLocationDot,
  faTruck,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { formatPeso } from "@/components/user/cart/cartData";
import { Badge } from "@/components/staff/PortalTable";
import type { Request } from "@/lib/mock/staff";
import { getStaffDeliveryRequestDetails } from "./staffDeliveryRequestDetails";

type DeliveryStatusAction = "Booked" | "Delivered";

export type StaffDeliveryRequestDetailsModalProps = {
  isOpen: boolean;
  deliveryRequest: Request | null;
  onClose: () => void;
  onStatusChange: (
    orderReference: string,
    nextStatus: DeliveryStatusAction,
  ) => void;
};

function formatDeliveryAmount(value: string) {
  if (value === "—") {
    return "Not available";
  }

  const numericValue = Number(value.replace(/[^0-9.]/g, ""));

  return Number.isFinite(numericValue)
    ? formatPeso(numericValue)
    : "Not available";
}

function getNextAction(status: string): DeliveryStatusAction | null {
  if (status === "Waiting for Booking") {
    return "Booked";
  }

  if (status === "In Transit") {
    return "Delivered";
  }

  return null;
}

function getActionLabel(nextStatus: DeliveryStatusAction) {
  return nextStatus === "Booked" ? "Mark as Booked" : "Mark Delivered";
}

function getConfirmationTitle(nextStatus: DeliveryStatusAction) {
  return nextStatus === "Booked"
    ? "Mark this delivery as Booked?"
    : "Mark this delivery as Delivered?";
}

function getConfirmationDescription(nextStatus: DeliveryStatusAction) {
  return nextStatus === "Booked"
    ? "Confirm only after the Lalamove booking has been completed manually."
    : "Confirm that the rider has completed the delivery.";
}

export default function StaffDeliveryRequestDetailsModal({
  isOpen,
  deliveryRequest,
  onClose,
  onStatusChange,
}: StaffDeliveryRequestDetailsModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const confirmationButtonRef = useRef<HTMLButtonElement>(null);
  const [confirmationAction, setConfirmationAction] =
    useState<DeliveryStatusAction | null>(null);

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
      if (event.key !== "Escape") {
        return;
      }

      if (confirmationAction) {
        setConfirmationAction(null);
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
  }, [confirmationAction, isOpen, onClose]);

  useEffect(() => {
    if (!confirmationAction) {
      return;
    }

    const focusFrame = window.requestAnimationFrame(() => {
      confirmationButtonRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(focusFrame);
  }, [confirmationAction]);

  if (!isOpen || !deliveryRequest) {
    return null;
  }

  const details = getStaffDeliveryRequestDetails(deliveryRequest);
  const nextAction = getNextAction(deliveryRequest.status);
  const actionLabel = nextAction ? getActionLabel(nextAction) : null;
  const hasBookingStatus =
    deliveryRequest.status === "Waiting for Booking" ||
    deliveryRequest.status === "Booked";

  const handleClose = () => {
    setConfirmationAction(null);
    onClose();
  };

  const handleStatusChange = () => {
    if (!confirmationAction) {
      return;
    }

    onStatusChange(deliveryRequest.orderReference, confirmationAction);
    setConfirmationAction(null);
  };

  return (
    <div className="admin-order-modal-overlay">
      <button
        className="admin-order-modal-backdrop"
        type="button"
        aria-label="Close delivery request details"
        onClick={handleClose}
      />

      <section
        className="admin-order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-delivery-modal-title"
        aria-describedby="staff-delivery-modal-description"
      >
        <header className="admin-order-modal-header">
          <div className="admin-order-modal-heading">
            <p>Delivery Request Details</p>
            <h2 id="staff-delivery-modal-title">
              {deliveryRequest.orderReference}
            </h2>
            <span id="staff-delivery-modal-description">
              Lalamove Delivery
            </span>
          </div>

          <div className="admin-order-modal-header-meta">
            <div>
              <Badge>{deliveryRequest.status}</Badge>
            </div>
            <span>Updated {deliveryRequest.updated}</span>
            <button
              ref={closeButtonRef}
              className="admin-order-modal-close"
              type="button"
              aria-label="Close delivery request details"
              onClick={handleClose}
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
              {details.customerPhone ? (
                <div>
                  <dt>Contact Number</dt>
                  <dd>{details.customerPhone}</dd>
                </div>
              ) : null}
              {details.customerEmail ? (
                <div>
                  <dt>Email</dt>
                  <dd>{details.customerEmail}</dd>
                </div>
              ) : null}
              {details.customerType ? (
                <div>
                  <dt>Customer Type</dt>
                  <dd>{details.customerType}</dd>
                </div>
              ) : null}
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
                <dd>{deliveryRequest.orderReference}</dd>
              </div>
              <div>
                <dt>Branch</dt>
                <dd>{deliveryRequest.branch}</dd>
              </div>
              <div>
                <dt>Last Updated</dt>
                <dd>{deliveryRequest.updated}</dd>
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
            {details.items.length ? (
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
            ) : (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Item snapshots are not available in the current delivery
                request record.
              </p>
            )}
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faTruck} aria-hidden="true" />
              <h3>Delivery Information</h3>
            </div>
            <dl className="admin-order-modal-detail-grid">
              <div>
                <dt>Destination</dt>
                <dd>{deliveryRequest.destination ?? "Not available"}</dd>
              </div>
              <div>
                <dt>Contact Person</dt>
                <dd>{deliveryRequest.customer}</dd>
              </div>
              {details.customerPhone ? (
                <div>
                  <dt>Contact Number</dt>
                  <dd>{details.customerPhone}</dd>
                </div>
              ) : null}
              {details.deliveryFee ? (
                <div>
                  <dt>Delivery Fee</dt>
                  <dd>{details.deliveryFee}</dd>
                </div>
              ) : null}
            </dl>
            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500">
              <FontAwesomeIcon
                icon={faLocationDot}
                className="mt-0.5 shrink-0 text-orange-500"
                aria-hidden="true"
              />
              A complete delivery address, delivery notes, and rider contact
              are not stored in the current Staff delivery request record.
            </p>
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faCreditCard} aria-hidden="true" />
              <h3>Payment Information</h3>
            </div>
            <dl className="admin-order-modal-detail-grid">
              <div>
                <dt>Payment Status</dt>
                <dd>
                  <Badge>{deliveryRequest.payment}</Badge>
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Payment verification remains available from the Staff Payments
              page.
            </p>
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faTruck} aria-hidden="true" />
              <h3>Lalamove / Booking Information</h3>
            </div>
            <dl className="admin-order-modal-detail-grid">
              {hasBookingStatus ? (
                <div>
                  <dt>Booking Status</dt>
                  <dd>{deliveryRequest.status}</dd>
                </div>
              ) : null}
              {hasBookingStatus ? (
                <div>
                  <dt>Booking Reference</dt>
                  <dd>
                    {deliveryRequest.status === "Waiting for Booking"
                      ? "Not yet available"
                      : "Not stored"}
                  </dd>
                </div>
              ) : null}
            </dl>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Staff manually books Lalamove outside this frontend. Booking
              references, booked times, rider details, and live tracking are
              not stored in the current request record.
            </p>
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faCircleDot} aria-hidden="true" />
              <h3>Delivery Status</h3>
            </div>
            <dl className="admin-order-modal-detail-grid">
              <div>
                <dt>Current Status</dt>
                <dd>
                  <Badge>{deliveryRequest.status}</Badge>
                </dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd>{deliveryRequest.updated}</dd>
              </div>
            </dl>
            {nextAction ? (
              <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500">
                <FontAwesomeIcon
                  icon={faCircleInfo}
                  className="mt-0.5 shrink-0 text-orange-500"
                  aria-hidden="true"
                />
                {nextAction === "Booked"
                  ? "Confirm the manual Lalamove booking before recording the delivery as booked."
                  : "Confirm that the rider has completed the delivery before marking it delivered."}
              </p>
            ) : (
              <p className="mt-4 text-xs leading-5 text-slate-500">
                This delivery request is read-only at its current status.
              </p>
            )}
          </section>
        </div>

        <footer className="admin-order-modal-footer">
          <span />
          <div className="admin-order-modal-footer-actions">
            <button
              className="admin-order-modal-button admin-order-modal-button-secondary"
              type="button"
              onClick={handleClose}
            >
              Close
            </button>
            {nextAction && actionLabel ? (
              <button
                className="admin-order-modal-button admin-order-modal-button-primary"
                type="button"
                onClick={() => setConfirmationAction(nextAction)}
              >
                <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
                {actionLabel}
              </button>
            ) : null}
          </div>
        </footer>
      </section>

      {confirmationAction ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/40 p-4">
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="staff-delivery-confirmation-title"
            aria-describedby="staff-delivery-confirmation-description"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-600">
                <FontAwesomeIcon icon={faTruck} aria-hidden="true" />
              </span>
              <div>
                <h3
                  id="staff-delivery-confirmation-title"
                  className="font-semibold text-[#0B1930]"
                >
                  {getConfirmationTitle(confirmationAction)}
                </h3>
                <p
                  id="staff-delivery-confirmation-description"
                  className="mt-2 text-sm leading-6 text-slate-600"
                >
                  {getConfirmationDescription(confirmationAction)}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="admin-order-modal-button admin-order-modal-button-secondary"
                type="button"
                onClick={() => setConfirmationAction(null)}
              >
                Cancel
              </button>
              <button
                ref={confirmationButtonRef}
                className="admin-order-modal-button admin-order-modal-button-primary"
                type="button"
                onClick={handleStatusChange}
              >
                {getActionLabel(confirmationAction)}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
