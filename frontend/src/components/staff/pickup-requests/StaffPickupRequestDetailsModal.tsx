"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faCartShopping,
  faCheck,
  faCircleDot,
  faCircleInfo,
  faCreditCard,
  faFileLines,
  faLocationDot,
  faStore,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { formatPeso } from "@/components/user/cart/cartData";
import { Badge } from "@/components/staff/PortalTable";
import type { Request } from "@/lib/mock/staff";
import { getStaffPickupRequestDetails } from "./staffPickupRequestDetails";

type PickupStatusAction = "Ready for Pickup" | "Completed";

export type StaffPickupRequestDetailsModalProps = {
  isOpen: boolean;
  pickupRequest: Request | null;
  onClose: () => void;
  onStatusChange: (
    orderReference: string,
    nextStatus: PickupStatusAction,
  ) => void;
};

function formatPickupAmount(value: string) {
  if (value === "—") {
    return "Not available";
  }

  const numericValue = Number(value.replace(/[^0-9.]/g, ""));

  return Number.isFinite(numericValue)
    ? formatPeso(numericValue)
    : "Not available";
}

function getNextAction(status: string): PickupStatusAction | null {
  if (status === "Preparing") {
    return "Ready for Pickup";
  }

  if (status === "Ready for Pickup") {
    return "Completed";
  }

  return null;
}

function getActionLabel(nextStatus: PickupStatusAction) {
  return nextStatus === "Ready for Pickup"
    ? "Mark Ready for Pickup"
    : "Mark Completed";
}

function getConfirmationTitle(nextStatus: PickupStatusAction) {
  return nextStatus === "Ready for Pickup"
    ? "Mark this order Ready for Pickup?"
    : "Complete this pickup?";
}

function getConfirmationDescription(nextStatus: PickupStatusAction) {
  return nextStatus === "Ready for Pickup"
    ? "Confirm that all order items have been prepared and the customer may now collect the order."
    : "Confirm that the customer has collected the order.";
}

export default function StaffPickupRequestDetailsModal({
  isOpen,
  pickupRequest,
  onClose,
  onStatusChange,
}: StaffPickupRequestDetailsModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const confirmationButtonRef = useRef<HTMLButtonElement>(null);
  const [confirmationAction, setConfirmationAction] =
    useState<PickupStatusAction | null>(null);

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

  if (!isOpen || !pickupRequest) {
    return null;
  }

  const details = getStaffPickupRequestDetails(pickupRequest);
  const nextAction = getNextAction(pickupRequest.status);
  const actionLabel = nextAction ? getActionLabel(nextAction) : null;

  const handleClose = () => {
    setConfirmationAction(null);
    onClose();
  };

  const handleStatusChange = () => {
    if (!confirmationAction) {
      return;
    }

    onStatusChange(pickupRequest.orderReference, confirmationAction);
    setConfirmationAction(null);
  };

  return (
    <div className="admin-order-modal-overlay">
      <button
        className="admin-order-modal-backdrop"
        type="button"
        aria-label="Close pickup request details"
        onClick={handleClose}
      />

      <section
        className="admin-order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-pickup-modal-title"
        aria-describedby="staff-pickup-modal-description"
      >
        <header className="admin-order-modal-header">
          <div className="admin-order-modal-heading">
            <p>Pickup Request Details</p>
            <h2 id="staff-pickup-modal-title">
              {pickupRequest.orderReference}
            </h2>
            <span id="staff-pickup-modal-description">Store Pickup</span>
          </div>

          <div className="admin-order-modal-header-meta">
            <div>
              <Badge>{pickupRequest.status}</Badge>
            </div>
            <span>Updated {pickupRequest.updated}</span>
            <button
              ref={closeButtonRef}
              className="admin-order-modal-close"
              type="button"
              aria-label="Close pickup request details"
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
                <dd>{pickupRequest.customer}</dd>
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
                <dd>{pickupRequest.orderReference}</dd>
              </div>
              <div>
                <dt>Branch</dt>
                <dd>{pickupRequest.branch}</dd>
              </div>
              <div>
                <dt>Last Updated</dt>
                <dd>{pickupRequest.updated}</dd>
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
                      <td>{formatPickupAmount(pickupRequest.amount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Item snapshots are not available in the current pickup request
                record.
              </p>
            )}
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faStore} aria-hidden="true" />
              <h3>Pickup Information</h3>
            </div>
            <dl className="admin-order-modal-detail-grid">
              <div>
                <dt>Pickup Branch</dt>
                <dd>{pickupRequest.branch}</dd>
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
              {details.branchAddress ? (
                <div>
                  <dt>Pickup Location</dt>
                  <dd>{details.branchAddress}</dd>
                </div>
              ) : null}
            </dl>
            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500">
              <FontAwesomeIcon
                icon={faLocationDot}
                className="mt-0.5 shrink-0 text-orange-500"
                aria-hidden="true"
              />
              Preferred pickup date, time, and notes are not stored in the
              current Staff pickup request record.
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
                  <Badge>{pickupRequest.payment}</Badge>
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Payment verification remains available from the Staff Payments
              page. Pay at Pickup is not treated as Paid.
            </p>
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faCircleDot} aria-hidden="true" />
              <h3>Pickup Status</h3>
            </div>
            <dl className="admin-order-modal-detail-grid">
              <div>
                <dt>Current Status</dt>
                <dd>
                  <Badge>{pickupRequest.status}</Badge>
                </dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd>{pickupRequest.updated}</dd>
              </div>
            </dl>
            {nextAction ? (
              <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500">
                <FontAwesomeIcon
                  icon={faCircleInfo}
                  className="mt-0.5 shrink-0 text-orange-500"
                  aria-hidden="true"
                />
                The next Staff step is to {nextAction === "Completed"
                  ? "confirm customer collection"
                  : "confirm the order is prepared"}.
              </p>
            ) : (
              <p className="mt-4 text-xs leading-5 text-slate-500">
                This pickup request is read-only at its current status.
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
                <FontAwesomeIcon
                  icon={nextAction === "Completed" ? faCheck : faBoxOpen}
                  aria-hidden="true"
                />
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
            aria-labelledby="staff-pickup-confirmation-title"
            aria-describedby="staff-pickup-confirmation-description"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-600">
                <FontAwesomeIcon
                  icon={
                    confirmationAction === "Completed" ? faCheck : faBoxOpen
                  }
                  aria-hidden="true"
                />
              </span>
              <div>
                <h3
                  id="staff-pickup-confirmation-title"
                  className="font-semibold text-[#0B1930]"
                >
                  {getConfirmationTitle(confirmationAction)}
                </h3>
                <p
                  id="staff-pickup-confirmation-description"
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
