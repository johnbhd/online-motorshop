"use client";

import { useEffect, useRef } from "react";
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
import { Badge } from "@/components/staff/PortalTable";
import type { Order } from "@/lib/mock/staff";
import { getStaffOrderDetails } from "./staffOrderDetails";

export type StaffOrderDetailsModalProps = {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
};

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

function displayValue(value?: string) {
  return value || "Not available";
}

export default function StaffOrderDetailsModal({
  isOpen,
  order,
  onClose,
}: StaffOrderDetailsModalProps) {
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

  if (!isOpen || !order) {
    return null;
  }

  const details = getStaffOrderDetails(order);
  const isPickup = order.fulfillment === "Store Pickup";

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
            <h2 id="staff-order-modal-title">{order.reference}</h2>
            <span id="staff-order-modal-description">Staff order view</span>
          </div>

          <div className="admin-order-modal-header-meta">
            <div>
              <Badge>{order.status}</Badge>
            </div>
            <span>Placed {order.date}</span>
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
                <dt>Contact Number</dt>
                <dd>{displayValue(details.customerPhone)}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{displayValue(details.customerEmail)}</dd>
              </div>
              <div>
                <dt>Customer Type</dt>
                <dd>{displayValue(details.customerType)}</dd>
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
                <dd>{order.date}</dd>
              </div>
              <div>
                <dt>Branch</dt>
                <dd>{displayValue(details.branch)}</dd>
              </div>
              <div>
                <dt>Fulfillment</dt>
                <dd>{order.fulfillment}</dd>
              </div>
              <div>
                <dt>Order Total</dt>
                <dd className="admin-order-modal-total">
                  {formatPeso(order.amount)}
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
                      <td>{formatPeso(order.amount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Item snapshots are not available in the current Staff order
                record.
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
                <dd>
                  <Badge>{order.payment}</Badge>
                </dd>
              </div>
              <div>
                <dt>Order Amount</dt>
                <dd className="admin-order-modal-total">
                  {formatPeso(order.amount)}
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
              <FontAwesomeIcon
                icon={isPickup ? faStore : faTruck}
                aria-hidden="true"
              />
              <h3>Fulfillment Information</h3>
            </div>
            <dl className="admin-order-modal-detail-grid">
              <div>
                <dt>Fulfillment</dt>
                <dd>{order.fulfillment}</dd>
              </div>
              <div>
                <dt>Branch</dt>
                <dd>{displayValue(details.branch)}</dd>
              </div>
              {!isPickup && (
                <div>
                  <dt>Delivery Address</dt>
                  <dd>{displayValue(details.deliveryAddress)}</dd>
                </div>
              )}
            </dl>
          </section>

          {isPickup ? (
            <section className="admin-order-modal-section">
              <div className="admin-order-modal-section-title">
                <FontAwesomeIcon icon={faStore} aria-hidden="true" />
                <h3>Pickup Information</h3>
              </div>
              <dl className="admin-order-modal-detail-grid">
                <div>
                  <dt>Pickup Branch</dt>
                  <dd>{displayValue(details.branch)}</dd>
                </div>
                <div>
                  <dt>Pickup Schedule</dt>
                  <dd>{displayValue(details.pickupSchedule)}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Pickup preparation and collection updates remain managed from
                the Staff Pickup Requests page.
              </p>
            </section>
          ) : (
            <section className="admin-order-modal-section">
              <div className="admin-order-modal-section-title">
                <FontAwesomeIcon icon={faTruck} aria-hidden="true" />
                <h3>Delivery Information</h3>
              </div>
              <dl className="admin-order-modal-detail-grid">
                <div>
                  <dt>Delivery Address</dt>
                  <dd>{displayValue(details.deliveryAddress)}</dd>
                </div>
                <div>
                  <dt>Delivery Fee</dt>
                  <dd>{displayValue(details.deliveryFee)}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Lalamove booking and delivery updates remain managed from the
                Staff Delivery Requests page.
              </p>
            </section>
          )}

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faCircleDot} aria-hidden="true" />
              <h3>Order Status</h3>
            </div>
            <dl className="admin-order-modal-detail-grid">
              <div>
                <dt>Current Status</dt>
                <dd>
                  <Badge>{order.status}</Badge>
                </dd>
              </div>
            </dl>
            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500">
              <FontAwesomeIcon
                icon={faInfoCircle}
                className="mt-0.5 shrink-0 text-orange-500"
                aria-hidden="true"
              />
              Staff Orders currently provides order context only; no
              lifecycle action is exposed here.
            </p>
          </section>
        </div>

        <footer className="admin-order-modal-footer">
          <span>Staff order view</span>
          <div className="admin-order-modal-footer-actions">
            <button
              className="admin-order-modal-button admin-order-modal-button-secondary"
              type="button"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
