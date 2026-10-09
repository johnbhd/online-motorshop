"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faCircleInfo,
  faFileLines,
  faFlag,
  faPaperPlane,
  faReply,
  faStar,
  faStore,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import ProductModalShell from "@/components/admin/products/ProductModalShell";
import { Badge } from "@/components/staff/PortalTable";
import type { ManagedReview } from "./ReviewsPage";
import ReviewRating from "./ReviewRating";

export type ReviewModalMode = "view" | "reply";

export type StaffReviewReply = {
  text: string;
  author?: string;
  repliedAt?: string;
};

export type StaffReviewDetailsModalProps = {
  isOpen: boolean;
  review: ManagedReview | null;
  mode: ReviewModalMode;
  reply?: StaffReviewReply;
  onClose: () => void;
  onSendReply?: (review: ManagedReview, replyText: string) => void;
  onFlagReview?: (review: ManagedReview) => void;
};

function formatReplyDate(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getModerationMessage(status: string) {
  if (status === "Flagged") {
    return "This review has been flagged for Admin attention.";
  }

  if (status === "Pending Review") {
    return "This review is pending moderation review. Staff cannot publish it.";
  }

  if (status === "Hidden") {
    return "This review is hidden and remains read-only for Staff.";
  }

  return null;
}

export default function StaffReviewDetailsModal({
  isOpen,
  review,
  mode,
  reply,
  onClose,
  onSendReply,
  onFlagReview,
}: StaffReviewDetailsModalProps) {
  const [replyDraft, setReplyDraft] = useState("");
  const [replyError, setReplyError] = useState("");

  if (!isOpen || !review) {
    return null;
  }

  const isReplyMode = mode === "reply" && !reply;
  const moderationMessage = getModerationMessage(review.status);
  const formattedReplyDate = formatReplyDate(reply?.repliedAt);

  const handleClose = () => {
    setReplyDraft("");
    setReplyError("");
    onClose();
  };

  const handleSubmitReply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedReply = replyDraft.trim();

    if (!trimmedReply) {
      setReplyError("Please enter a reply.");
      return;
    }

    if (!onSendReply) {
      return;
    }

    onSendReply(review, trimmedReply);
    setReplyDraft("");
    setReplyError("");
  };

  return (
    <ProductModalShell
      isOpen={isOpen}
      eyebrow="Review Details"
      title={review.customer}
      description={`Review for ${review.product}`}
      titleId="staff-review-details-modal-title"
      descriptionId="staff-review-details-modal-description"
      status={<Badge>{review.status}</Badge>}
      onClose={handleClose}
      footer={
        <>
          <span>
            {isReplyMode
              ? "Your response will be shown to the customer."
              : "Staff review view"}
          </span>
          <div className="admin-order-modal-footer-actions">
            {isReplyMode ? (
              <>
                <button
                  className="admin-order-modal-button admin-order-modal-button-secondary"
                  type="button"
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <button
                  className="admin-order-modal-button admin-order-modal-button-primary"
                  type="submit"
                  form="staff-review-reply-form"
                  disabled={!onSendReply}
                >
                  <FontAwesomeIcon icon={faPaperPlane} aria-hidden="true" />
                  Send Reply
                </button>
              </>
            ) : (
              <>
                {onFlagReview && review.status !== "Hidden" ? (
                  <button className="admin-order-modal-button admin-order-modal-button-secondary" type="button" onClick={() => onFlagReview(review)}>
                    <FontAwesomeIcon icon={faFlag} aria-hidden="true" />
                    Flag for Admin
                  </button>
                ) : null}
                <button className="admin-order-modal-button admin-order-modal-button-secondary" type="button" onClick={handleClose}>Close</button>
              </>
            )}
          </div>
        </>
      }
    >
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
            {review.initials}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-[#0B1930]">{review.customer}</p>
            <p className="text-sm text-slate-500">Customer review</p>
          </div>
        </div>
        <dl className="admin-order-modal-detail-grid">
          <div>
            <dt>Customer</dt>
            <dd>{review.customer}</dd>
          </div>
          <div>
            <dt>Branch</dt>
            <dd>{review.branch}</dd>
          </div>
        </dl>
      </section>

      <section className="admin-order-modal-section">
        <div className="admin-order-modal-section-title">
          <FontAwesomeIcon icon={faStar} aria-hidden="true" />
          <h3>Review Information</h3>
        </div>
        <dl className="admin-order-modal-detail-grid">
          <div>
            <dt>Product</dt>
            <dd>{review.product}</dd>
          </div>
          <div>
            <dt>Rating</dt>
            <dd>
              <ReviewRating rating={review.rating} showValue />
            </dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd className="inline-flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendarDays} aria-hidden="true" />
              {review.date}
            </dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <Badge>{review.status}</Badge>
            </dd>
          </div>
        </dl>
      </section>

      <section className="admin-order-modal-section">
        <div className="admin-order-modal-section-title">
          <FontAwesomeIcon icon={faFileLines} aria-hidden="true" />
          <h3>Review</h3>
        </div>
        <blockquote className="m-0 break-words rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
          {review.review}
        </blockquote>
      </section>

      <section className="admin-order-modal-section">
        <div className="admin-order-modal-section-title">
          <FontAwesomeIcon icon={faReply} aria-hidden="true" />
          <h3>Staff Response</h3>
        </div>
        {reply ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4">
            <p className="break-words text-sm leading-7 text-slate-700">
              {reply.text}
            </p>
            <p className="mt-3 text-xs font-semibold text-slate-500">
              {reply.author ?? "ALD Staff"}
              {formattedReplyDate ? ` · ${formattedReplyDate}` : ""}
            </p>
          </div>
        ) : isReplyMode ? (
          <form
            id="staff-review-reply-form"
            onSubmit={handleSubmitReply}
            className="space-y-3"
          >
            <label
              className="admin-order-modal-field"
              htmlFor="staff-review-reply"
            >
              <span>Reply to Customer</span>
              <textarea
                id="staff-review-reply"
                value={replyDraft}
                onChange={(event) => {
                  setReplyDraft(event.target.value);
                  setReplyError("");
                }}
                aria-describedby={
                  replyError ? "staff-review-reply-error" : undefined
                }
                aria-invalid={Boolean(replyError)}
                placeholder="Write a helpful response to the customer"
              />
            </label>
            {replyError ? (
              <p
                id="staff-review-reply-error"
                className="text-sm font-semibold text-red-700"
                role="alert"
              >
                {replyError}
              </p>
            ) : null}
          </form>
        ) : (
          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            No staff response yet.
          </p>
        )}
      </section>

      {moderationMessage ? (
        <div className="admin-order-review-notice">
          <FontAwesomeIcon
            icon={review.status === "Flagged" ? faFlag : faCircleInfo}
            aria-hidden="true"
          />
          <p>
            <strong>Moderation context</strong>
            <span>{moderationMessage}</span>
          </p>
        </div>
      ) : null}

      <section className="admin-order-modal-section">
        <div className="admin-order-modal-section-title">
          <FontAwesomeIcon icon={faStore} aria-hidden="true" />
          <h3>Staff Permissions</h3>
        </div>
        <p className="text-sm leading-6 text-slate-600">
          Staff can respond to customer reviews. Admin-only moderation actions
          such as publishing, hiding, deleting, or restoring reviews are not
          available here.
        </p>
      </section>
    </ProductModalShell>
  );
}
