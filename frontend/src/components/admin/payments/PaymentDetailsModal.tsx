"use client";

import { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faCheck,
  faCircleInfo,
  faCreditCard,
  faFileLines,
  faImage,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { formatPeso } from "@/components/user/cart/cartData";
import { AdminBadge } from "@/components/admin/AdminDataTable";
import { adminCustomers, type AdminPayment } from "@/lib/mock/admin";

export type PaymentModalMode = "review" | "view";

export type PaymentDetailsModalProps = {
  isOpen: boolean;
  mode: PaymentModalMode;
  payment: AdminPayment | null;
  onClose: () => void;
  onVerify?: (orderId: string) => void;
  onReject?: (orderId: string) => void;
};

function formatPaymentAmount(value: string) {
  if (value === "—") {
    return "Not available";
  }

  const numericValue = Number(value.replace(/[^0-9.]/g, ""));

  return Number.isFinite(numericValue)
    ? formatPeso(numericValue)
    : "Not available";
}

function formatPaymentDate(value: string) {
  return value === "—" ? "Not available" : value;
}

export default function PaymentDetailsModal({
  isOpen,
  mode,
  payment,
  onClose,
  onVerify,
  onReject,
}: PaymentDetailsModalProps) {
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

  if (!isOpen || !payment) {
    return null;
  }

  const customer = adminCustomers.find(
    (adminCustomer) => adminCustomer.name === payment.customer,
  );
  const isReviewMode = mode === "review";
  const paymentDate = formatPaymentDate(payment.date);

  const closeModal = () => {
    onClose();
  };

  const handleVerify = () => {
    if (onVerify) {
      onVerify(payment.order);
      return;
    }

    closeModal();
  };

  const handleReject = () => {
    if (onReject) {
      onReject(payment.order);
      return;
    }

    closeModal();
  };

  return (
    <div className="admin-order-modal-overlay">
      <button
        className="admin-order-modal-backdrop"
        type="button"
        aria-label="Close payment details"
        onClick={closeModal}
      />

      <section
        className="admin-order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-payment-modal-title"
        aria-describedby="admin-payment-modal-description"
      >
        <header className="admin-order-modal-header">
          <div className="admin-order-modal-heading">
            <p>Payment Details</p>
            <h2 id="admin-payment-modal-title">{payment.order}</h2>
            <span id="admin-payment-modal-description">
              {isReviewMode ? "Review payment" : "View payment"}
            </span>
          </div>

          <div className="admin-order-modal-header-meta">
            <AdminBadge>{payment.status}</AdminBadge>
            <span>Recorded {paymentDate}</span>
            <button
              ref={closeButtonRef}
              className="admin-order-modal-close"
              type="button"
              aria-label="Close payment details"
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
                <dd>{payment.customer}</dd>
              </div>
              {customer?.contact ? (
                <div>
                  <dt>Phone</dt>
                  <dd>{customer.contact}</dd>
                </div>
              ) : null}
              {customer?.email ? (
                <div>
                  <dt>Email</dt>
                  <dd>{customer.email}</dd>
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
                <dd>{payment.order}</dd>
              </div>
              <div>
                <dt>Branch</dt>
                <dd>{payment.branch}</dd>
              </div>
              <div>
                <dt>Payment Method</dt>
                <dd>{payment.method}</dd>
              </div>
              <div>
                <dt>Order Total</dt>
                <dd className="admin-order-modal-total">
                  {formatPaymentAmount(payment.total)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faCreditCard} aria-hidden="true" />
              <h3>Payment Information</h3>
            </div>
            <dl className="admin-order-modal-detail-grid admin-order-modal-order-grid">
              <div>
                <dt>Amount Paid</dt>
                <dd className="admin-order-modal-total">
                  {formatPaymentAmount(payment.paid)}
                </dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <AdminBadge>{payment.status}</AdminBadge>
                </dd>
              </div>
              <div>
                <dt>Verified By</dt>
                <dd>
                  {payment.verifiedBy === "—"
                    ? "Not available"
                    : payment.verifiedBy}
                </dd>
              </div>
              <div>
                <dt>Payment Date</dt>
                <dd>{paymentDate}</dd>
              </div>
            </dl>
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faImage} aria-hidden="true" />
              <h3>Proof of Payment</h3>
            </div>
            <div className="grid min-h-36 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center">
              <div>
                <FontAwesomeIcon
                  icon={faImage}
                  className="text-2xl text-slate-400"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  No payment proof available
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  The current payment record does not include an uploaded proof
                  image.
                </p>
              </div>
            </div>
          </section>

          {isReviewMode ? (
            <section className="admin-order-modal-section">
              <div className="admin-order-modal-section-title">
                <FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" />
                <h3>Payment Review</h3>
              </div>
              <div className="admin-order-review-notice">
                <FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" />
                <p>
                  <strong>Review the payment details before deciding.</strong>
                  <span>
                    Verify or reject this record using the available payment
                    information.
                  </span>
                </p>
              </div>
            </section>
          ) : null}
        </div>

        <footer className="admin-order-modal-footer">
          {isReviewMode ? (
            <button
              className="admin-order-modal-button admin-order-modal-button-danger"
              type="button"
              onClick={handleReject}
            >
              <FontAwesomeIcon icon={faBan} aria-hidden="true" />
              Reject Payment
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
                onClick={handleVerify}
              >
                <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
                Verify Payment
              </button>
            ) : null}
          </div>
        </footer>
      </section>
    </div>
  );
}
