"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getStaffCustomer,
  getStaffCustomersErrorMessage,
} from "./staffCustomersApi";
import type {
  StaffCustomerDetails,
  StaffCustomerOrderSummary,
} from "./staffCustomersTypes";

type Props = {
  customerId: number | null;
  onClose: () => void;
};

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not available"
    : dateFormatter.format(date);
}

function formatLabel(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayValue(value: string | null) {
  return value?.trim() || "Not provided";
}

function fulfillmentLabel(order: StaffCustomerOrderSummary) {
  return order.fulfillment_method === "delivery"
    ? "Lalamove Delivery"
    : "Store Pickup";
}

function CustomerOrdersTable({
  orders,
  emptyMessage,
}: {
  orders: StaffCustomerOrderSummary[];
  emptyMessage: string;
}) {
  if (!orders.length) {
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
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <Link
                  href={`/staff/orders/${encodeURIComponent(order.reference)}`}
                  className="font-semibold text-orange-600 hover:text-orange-700 hover:underline"
                >
                  {order.reference}
                </Link>
              </td>
              <td>{formatDate(order.created_at)}</td>
              <td>{fulfillmentLabel(order)}</td>
              <td>{formatCurrency(order.total_amount)}</td>
              <td>
                <Badge>{formatLabel(order.status)}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RealStaffCustomerDetailsModal({
  customerId,
  onClose,
}: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [details, setDetails] = useState<StaffCustomerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    if (customerId === null) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      const token = getAuthToken();

      if (!token) {
        setDetails(null);
        setIsLoading(false);
        setError("Your Staff session has expired. Please sign in again.");
        return;
      }

      setDetails(null);
      setIsLoading(true);
      setError(null);

      try {
        setDetails(
          await getStaffCustomer(token, customerId, controller.signal),
        );
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }

        setError(
          getStaffCustomersErrorMessage(
            requestError,
            "Customer details could not be loaded. Please try again.",
          ),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 0);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [customerId, reloadNonce]);

  useEffect(() => {
    if (customerId === null) {
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
  }, [customerId, onClose]);

  if (customerId === null) {
    return null;
  }

  const customerName = details?.customer.name ?? "Customer";
  const isRegistered = details?.customer.type === "registered";

  return (
    <div className="admin-order-modal-overlay">
      <button
        className="admin-order-modal-backdrop"
        type="button"
        aria-label={`Close customer details for ${customerName}`}
        onClick={onClose}
      />

      <section
        className="admin-order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-customer-modal-title"
      >
        <header className="admin-order-modal-header">
          <div className="admin-order-modal-heading">
            <p>Customer Details</p>
            <h2 id="staff-customer-modal-title">{customerName}</h2>
            <span>
              {details
                ? isRegistered
                  ? "Registered customer"
                  : "Guest customer"
                : "Loading customer record"}
            </span>
          </div>

          <div className="admin-order-modal-header-meta">
            {details ? <Badge>{isRegistered ? "Registered" : "Guest"}</Badge> : null}
            <button
              ref={closeButtonRef}
              className="admin-order-modal-close"
              type="button"
              aria-label={`Close customer details for ${customerName}`}
              onClick={onClose}
            >
              <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="admin-order-modal-body">
          {isLoading ? <CustomerDetailsLoadingState /> : null}

          {error ? (
            <div className="px-4 py-12 text-center" role="alert">
              <p className="font-semibold text-[#0B1930]">
                Unable to load customer details
              </p>
              <p className="mt-2 text-sm text-slate-500">{error}</p>
              <button
                type="button"
                onClick={() => setReloadNonce((nonce) => nonce + 1)}
                className="mt-5 rounded-lg bg-[#0B1930] px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Retry
              </button>
            </div>
          ) : null}

          {details ? <CustomerDetailsContent details={details} /> : null}
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

function CustomerDetailsContent({ details }: { details: StaffCustomerDetails }) {
  const { customer, summary } = details;
  const isRegistered = customer.type === "registered";

  return (
    <>
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
            <dd>{displayValue(customer.email)}</dd>
          </div>
          <div>
            <dt>Contact Number</dt>
            <dd>{displayValue(customer.contact)}</dd>
          </div>
          <div>
            <dt>Address</dt>
            <dd>{displayValue(customer.address)}</dd>
          </div>
          <div>
            <dt>Branch Scope</dt>
            <dd>{customer.branch.name}</dd>
          </div>
          <div>
            <dt>Customer Since</dt>
            <dd>{formatDate(customer.customer_since)}</dd>
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
              This record does not have a registered ALD account. No account or
              authentication information is available to Staff.
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
            <dd>{summary.orders}</dd>
          </div>
          <div>
            <dt>Active Orders</dt>
            <dd>{summary.active_orders}</dd>
          </div>
          <div>
            <dt>Completed Orders</dt>
            <dd>{summary.completed_orders}</dd>
          </div>
          <div>
            <dt>Last Order</dt>
            <dd>{summary.last_order?.reference ?? "Not available"}</dd>
          </div>
        </dl>
        <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500">
          <FontAwesomeIcon
            icon={faCircleInfo}
            className="mt-0.5 shrink-0 text-orange-500"
            aria-hidden="true"
          />
          Counts and order history are limited to persisted orders in the
          authorized Staff branch.
        </p>
      </section>

      <section className="admin-order-modal-section">
        <div className="admin-order-modal-section-title">
          <FontAwesomeIcon icon={faClipboardList} aria-hidden="true" />
          <h3>Active Orders</h3>
        </div>
        <CustomerOrdersTable
          orders={details.active_orders}
          emptyMessage="No active Staff order records are linked to this customer."
        />
      </section>

      <section className="admin-order-modal-section">
        <div className="admin-order-modal-section-title">
          <FontAwesomeIcon icon={faClock} aria-hidden="true" />
          <h3>Recent Orders</h3>
        </div>
        <CustomerOrdersTable
          orders={details.recent_orders}
          emptyMessage="No recent Staff order records are linked to this customer."
        />
      </section>
    </>
  );
}

function CustomerDetailsLoadingState() {
  return (
    <div className="space-y-5 px-1 py-2" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading customer details</span>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="space-y-3">
          <div className="motion-safe:animate-pulse h-5 w-40 rounded bg-slate-100" />
          <div className="motion-safe:animate-pulse h-20 rounded-lg bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
