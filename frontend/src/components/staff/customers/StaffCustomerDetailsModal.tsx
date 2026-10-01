"use client";

import { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faCircleInfo,
  faClock,
  faClipboardList,
  faIdCard,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/staff/PortalTable";
import type { Customer, Order } from "@/lib/mock/staff";
import { getStaffCustomerOrderDetails } from "./staffCustomerDetails";

export type StaffCustomerDetailsModalProps = {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
};

function formatOrderAmount(value: string) {
  if (value === "—") {
    return "Not available";
  }

  return value || "Not available";
}

function getDisplayValue(value: string) {
  return value || "Not available";
}

function CustomerOrdersTable({
  orders: customerOrders,
  emptyMessage,
}: {
  orders: Order[];
  emptyMessage: string;
}) {
  if (!customerOrders.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="admin-order-items-table-wrap admin-customer-orders-table-wrap">
      <table className="admin-order-items-table admin-customer-orders-table">
        <thead>
          <tr>
            <th scope="col">Order</th>
            <th scope="col">Date</th>
            <th scope="col">Fulfillment</th>
            <th scope="col">Amount</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {customerOrders.map((order) => (
            <tr key={order.reference}>
              <td>{order.reference}</td>
              <td>{order.date}</td>
              <td>{order.fulfillment}</td>
              <td>{formatOrderAmount(order.amount)}</td>
              <td>
                <Badge>{order.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function StaffCustomerDetailsModal({
  isOpen,
  customer,
  onClose,
}: StaffCustomerDetailsModalProps) {
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

  const { activeOrders, recentOrders } =
    getStaffCustomerOrderDetails(customer);
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
        aria-labelledby="staff-customer-modal-title"
        aria-describedby="staff-customer-modal-description"
      >
        <header className="admin-order-modal-header">
          <div className="admin-order-modal-heading">
            <p>Customer Details</p>
            <h2 id="staff-customer-modal-title">{customer.name}</h2>
            <span id="staff-customer-modal-description">
              {isRegistered ? "Registered customer" : "Guest customer"}
            </span>
          </div>

          <div className="admin-order-modal-header-meta">
            <Badge>{customer.type}</Badge>
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
            <div className="mb-5 flex items-center gap-3">
              <span
                className="grid size-12 shrink-0 place-items-center rounded-full bg-orange-50 font-bold text-orange-700"
                aria-hidden="true"
              >
                {customer.initials}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-[#0B1930]">{customer.name}</p>
                <p className="text-sm text-slate-500">
                  {isRegistered ? "Registered account" : "Guest checkout record"}
                </p>
              </div>
            </div>
            <dl className="admin-order-modal-detail-grid">
              <div>
                <dt>Customer Name</dt>
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
                <dt>Associated Branch</dt>
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
                  <dd>Registered customer</dd>
                </div>
              </dl>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <strong className="block text-sm text-[#0B1930]">
                  Guest customer
                </strong>
                <p className="mt-1">
                  This record does not have a registered ALD account. No account
                  or authentication information is available to Staff.
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
                <dt>Total Orders</dt>
                <dd>{customer.orders}</dd>
              </div>
              <div>
                <dt>Active Orders</dt>
                <dd>{customer.activeOrders}</dd>
              </div>
              <div>
                <dt>Last Order</dt>
                <dd>{getDisplayValue(customer.lastOrder)}</dd>
              </div>
            </dl>
            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500">
              <FontAwesomeIcon
                icon={faCircleInfo}
                className="mt-0.5 shrink-0 text-orange-500"
                aria-hidden="true"
              />
              Counts and last-order information use the current Staff customer
              record; the lists below show only linked Staff order records.
            </p>
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faClipboardList} aria-hidden="true" />
              <h3>Active Orders</h3>
            </div>
            <CustomerOrdersTable
              orders={activeOrders}
              emptyMessage="No active Staff order records are linked to this customer."
            />
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faClock} aria-hidden="true" />
              <h3>Recent Orders</h3>
            </div>
            <CustomerOrdersTable
              orders={recentOrders}
              emptyMessage="No recent Staff order records are linked to this customer."
            />
          </section>
        </div>

        <footer className="admin-order-modal-footer">
          <span>Read-only Staff customer view</span>
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
