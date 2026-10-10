"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleExclamation,
  faClock,
  faCreditCard,
  faImage,
  faStore,
} from "@fortawesome/free-solid-svg-icons";
import { getOrderApiErrorMessage, submitPaymentProof } from "@/lib/orders/orderApi";
import { toOrderViewModel } from "@/lib/orders/orderAdapter";
import { formatPeso } from "../cart/cartData";
import type { OrderViewModel } from "@/lib/orders/orderTypes";
import PaymentInstructionsModal from "./PaymentInstructionsModal";

type OrderPaymentSectionProps = {
  order: OrderViewModel;
  paymentToken?: string | null;
  onOrderUpdated?: (order: OrderViewModel) => void;
};

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/[-\s]+/g, "_");
}

function isEligibleOrderStatus(status: string): boolean {
  return [
    "confirmed",
    "preparing",
    "preparing_order",
    "ready_for_pickup",
    "booked_for_delivery",
    "picked_up_by_rider",
  ].includes(normalize(status));
}

export default function OrderPaymentSection({
  order,
  paymentToken,
  onOrderUpdated,
}: OrderPaymentSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const payment = order.payment;
  const paymentMethod = payment?.method ?? "Payment method unavailable";
  const paymentStatus = normalize(payment?.status ?? order.paymentStatus);
  const orderStatus = normalize(order.status);
  const isPickup = paymentMethod.toLowerCase().includes("pay at pickup");
  const isOnline = paymentMethod.toLowerCase().includes("online");
  const isPaid = paymentStatus === "paid";
  const isWaitingForVerification = paymentStatus === "waiting_for_verification";
  const isRejectedProof = paymentStatus === "failed";
  const isInteractive = Boolean(paymentToken && onOrderUpdated);
  const isTerminalOrder = ["cancelled", "rejected"].includes(orderStatus);
  const amount = payment?.amount ?? order.totalAmount ?? order.estimatedTotal;
  const canSubmitOnlineProof =
    Boolean(paymentToken && onOrderUpdated) &&
    isOnline &&
    !isTerminalOrder &&
    !isPaid &&
    !isWaitingForVerification &&
    (isRejectedProof || (paymentStatus === "unpaid" && isEligibleOrderStatus(order.status)));
  const canViewInstructions =
    isOnline &&
    !isTerminalOrder &&
    !isPaid &&
    !isWaitingForVerification &&
    (isRejectedProof || (paymentStatus === "unpaid" && isEligibleOrderStatus(order.status)));

  const handleSubmit = async (file: File) => {
    if (!paymentToken || !onOrderUpdated) {
      setSubmitError("Your session has expired. Please sign in again.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setSuccessMessage("");

    try {
      const response = await submitPaymentProof(paymentToken, order.reference, file);
      const updatedOrder = response.order;

      onOrderUpdated(toOrderViewModel(updatedOrder));
      setModalOpen(false);
      setSuccessMessage("Payment proof submitted successfully. ALD Staff will review your payment.");
    } catch (error) {
      setSubmitError(
        getOrderApiErrorMessage(
          error,
          "We could not submit your payment proof. Please try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentHeading = isPaid
    ? "Paid"
    : isTerminalOrder
      ? "No payment action available"
      : isPickup
        ? orderStatus === "pending" || orderStatus === "under_review"
          ? "Not Yet Due"
          : "Payment Due at Pickup"
        : paymentStatus === "waiting_for_verification"
          ? "Waiting for Verification"
          : isRejectedProof
            ? "Proof Rejected"
            : paymentStatus === "unpaid" && !isEligibleOrderStatus(order.status)
              ? "Payment Not Available Yet"
              : "Unpaid";

  const paymentDescription = isPaid
    ? payment?.verifiedAt
      ? `Verified on ${new Date(payment.verifiedAt).toLocaleDateString("en-PH")}.`
      : "ALD Staff has verified this payment."
    : isTerminalOrder
      ? "This order is closed, so no payment action is available."
      : isPickup
        ? orderStatus === "ready_for_pickup"
          ? "Pay the amount due at the pickup branch when you collect your order."
          : "Pay the amount due at the pickup branch after ALD Staff confirms it is ready."
        : paymentStatus === "waiting_for_verification"
          ? "Your proof was submitted successfully. ALD Staff will verify it before marking the payment paid."
          : isRejectedProof
            ? "Your submitted payment proof could not be verified. Review the instructions and submit a new proof."
            : paymentStatus === "unpaid" && !isEligibleOrderStatus(order.status)
              ? "Payment instructions will become available after ALD Staff confirms your order."
              : "Complete your payment, then upload the receipt for ALD Staff verification.";

  const actionLabel = isWaitingForVerification ? "View Submitted Proof" : isRejectedProof ? "Upload New Proof" : "View Payment Instructions";
  const canOpenModal =
    isInteractive &&
    (canViewInstructions || (isWaitingForVerification && Boolean(payment?.proofImageUrl)));

  return (
    <>
      <section
        className="track-order-card track-order-support-card track-order-payment-card"
        aria-labelledby="track-order-payment-title"
      >
        <span className="track-order-support-icon" aria-hidden="true">
          <FontAwesomeIcon icon={isPickup ? faStore : faCreditCard} />
        </span>
        <p className="track-order-section-eyebrow">PAYMENT</p>
        <h2 id="track-order-payment-title">Payment Status</h2>
        <div className="track-order-payment-method">
          <span>Payment method</span>
          <strong>{paymentMethod}</strong>
        </div>
        <div className="track-order-payment-status-row">
          <strong>{paymentHeading}</strong>
          <FontAwesomeIcon
            icon={isPaid ? faCircleCheck : isWaitingForVerification ? faClock : isRejectedProof ? faCircleExclamation : faCreditCard}
            aria-hidden="true"
          />
        </div>
        <p>{paymentDescription}</p>
        {amount !== null ? (
          <div className="track-order-support-detail">
            <span>{isPaid ? "Amount paid" : "Amount due"}</span>
            <strong>{formatPeso(amount)}</strong>
          </div>
        ) : null}
        {successMessage ? <p className="track-order-payment-success" role="status">{successMessage}</p> : null}
        {canOpenModal ? (
          <button
            className="track-order-payment-action"
            type="button"
            onClick={() => {
              setSubmitError("");
              setModalOpen(true);
            }}
          >
            <FontAwesomeIcon icon={isWaitingForVerification ? faImage : faCreditCard} aria-hidden="true" />
            <span>{actionLabel}</span>
          </button>
        ) : null}
      </section>
      {modalOpen ? (
        <PaymentInstructionsModal
          orderReference={order.reference}
          paymentMethod={paymentMethod}
          amount={amount}
          paymentStatus={payment?.status ?? order.paymentStatus}
          proofImageUrl={payment?.proofImageUrl ?? null}
          canUpload={canSubmitOnlineProof}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      ) : null}
    </>
  );
}
