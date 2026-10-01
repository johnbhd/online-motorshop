"use client";

import { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faClipboardList,
  faIdCard,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { formatPeso } from "@/components/user/cart/cartData";
import { AdminBadge } from "@/components/admin/AdminDataTable";
import {
  adminOrders,
  type AdminCustomer,
} from "@/lib/mock/admin";

export type CustomerDetailsModalProps = {
  isOpen: boolean;
  customer: AdminCustomer | null;
  onClose: () => void;
};

function formatCustomerAmount(value: string) {
  if (value === "—") {
    return "Not available";
  }

  const numericValue = Number(value.replace(/[^0-9.]/g, ""));

  return Number.isFinite(numericValue)
    ? formatPeso(numericValue)
    : "Not available";
}

function getDisplayValue(value: string) {
  return value || "Not available";
}

export default function CustomerDetailsModal({
  isOpen,
  customer,
  onClose,
}: CustomerDetailsModalProps) {
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

  if (!isOpen || !customer) {
    return null;
  }

  const recentOrders = adminOrders
    .filter((order) => order.customer === customer.name)
    .slice(0, 5);
  const isRegistered = customer.type === "Registered";

  return (
    <div className="admin-order-modal-overlay">
      <button
        className="admin-order-modal-backdrop"
        type="button"
        aria-label={`Close customer details for ${customer.name}`}
        onClick={onClose}
      />

      <section
        className="admin-order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-customer-modal-title"
        aria-describedby="admin-customer-modal-description"
      >
        <header className="admin-order-modal-header">
          <div className="admin-order-modal-heading">
            <p>Customer Details</p>
            <h2 id="admin-customer-modal-title">{customer.name}</h2>
            <span id="admin-customer-modal-description">
              {isRegistered ? "Registered customer" : "Guest customer"}
            </span>
          </div>

          <div className="admin-order-modal-header-meta">
            <AdminBadge>{customer.type}</AdminBadge>
            <button
              ref={closeButtonRef}
              className="admin-order-modal-close"
              type="button"
              aria-label={`Close customer details for ${customer.name}`}
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
                <dd>{customer.name}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{getDisplayValue(customer.email)}</dd>
              </div>
              <div>
                <dt>Contact Number</dt>
                <dd>{getDisplayValue(customer.contact)}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{getDisplayValue(customer.location)}</dd>
              </div>
              <div>
                <dt>Branch</dt>
                <dd>{getDisplayValue(customer.branch)}</dd>
              </div>
            </dl>
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faIdCard} aria-hidden="true" />
              <h3>Account Information</h3>
            </div>
            {isRegistered ? (
              <dl className="admin-order-modal-detail-grid">
                <div>
                  <dt>Account Type</dt>
                  <dd>{customer.type} customer</dd>
                </div>
              </dl>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <strong className="block text-sm text-[#0B1930]">
                  Guest customer
                </strong>
                <p className="mt-1">
                  This customer does not have a registered ALD account.
                </p>
              </div>
            )}
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faChartLine} aria-hidden="true" />
              <h3>Customer Activity</h3>
            </div>
            <dl className="admin-order-modal-detail-grid admin-order-modal-order-grid">
              <div>
                <dt>Activity</dt>
                <dd>
                  <AdminBadge>{customer.status}</AdminBadge>
                </dd>
              </div>
              <div>
                <dt>Total Orders</dt>
                <dd>{customer.orders}</dd>
              </div>
              <div>
                <dt>Active Orders</dt>
                <dd>{customer.activeOrders}</dd>
              </div>
              <div>
                <dt>Total Ordered</dt>
                <dd className="admin-order-modal-total">
                  {formatCustomerAmount(customer.totalOrdered)}
                </dd>
              </div>
              <div>
                <dt>Last Order</dt>
                <dd>{getDisplayValue(customer.lastOrder)}</dd>
              </div>
            </dl>
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faClipboardList} aria-hidden="true" />
              <h3>Recent Orders</h3>
            </div>
            {recentOrders.length ? (
              <div className="admin-order-items-table-wrap admin-customer-orders-table-wrap">
                <table className="admin-order-items-table admin-customer-orders-table">
                  <thead>
                    <tr>
                      <th scope="col">Order</th>
                      <th scope="col">Updated</th>
                      <th scope="col">Branch</th>
                      <th scope="col">Fulfillment</th>
                      <th scope="col">Total</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.reference}>
                        <td>{order.reference}</td>
                        <td>{order.updated}</td>
                        <td>{order.branch}</td>
                        <td>{order.fulfillment}</td>
                        <td>{formatCustomerAmount(order.amount)}</td>
                        <td>
                          <AdminBadge>{order.status}</AdminBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No orders found for this customer.
              </div>
            )}
          </section>
        </div>

        <footer className="admin-order-modal-footer">
          <span />
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
