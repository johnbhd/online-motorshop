"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  faEye,
  faFlag,
  faReply,
} from "@fortawesome/free-solid-svg-icons";
import ActionButton from "@/components/staff/ActionButton";
import PortalTable, {
  Badge,
  type Column,
} from "@/components/staff/PortalTable";
import StaffPageHeader from "@/components/staff/StaffPageHeader";
import Summary from "@/components/staff/Summary";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  flagStaffReview,
  getManagedReviews,
  getReviewErrorMessage,
  sendStaffReviewResponse,
  type ProductReview,
} from "@/lib/reviews/reviewApi";
import ReviewRating from "./ReviewRating";
import StaffReviewDetailsModal, {
  type ReviewModalMode,
} from "./StaffReviewDetailsModal";

export type ManagedReview = {
  id: number;
  customer: string;
  initials: string;
  product: string;
  rating: number;
  review: string;
  branch: string;
  status: string;
  date: string;
  action: string;
  response?: { text: string; author?: string; repliedAt?: string } | null;
};

function statusLabel(status?: ProductReview["status"]) {
  return status === "pending_review" ? "Pending Review" : status === "flagged" ? "Flagged" : status === "hidden" ? "Hidden" : "Published";
}

function toManagedReview(review: ProductReview): ManagedReview {
  return {
    id: review.id,
    customer: review.customer.name,
    initials: review.customer.initials,
    product: review.product?.name ?? "Product",
    rating: review.rating,
    review: review.review_text,
    branch: review.branch ?? "—",
    status: statusLabel(review.status),
    date: review.created_at ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(review.created_at)) : "—",
    action: review.response ? "View Review" : "Reply",
    response: review.response ? { text: review.response.text, author: review.response.author ?? undefined, repliedAt: review.response.created_at ?? undefined } : null,
  };
}

export default function ReviewsPage() {
  const [reviewRecords, setReviewRecords] = useState<ManagedReview[]>([]);
  const [summary, setSummary] = useState({ total: 0, average_rating: 0, awaiting_reply: 0, needs_admin_review: 0 });
  const [selectedReview, setSelectedReview] = useState<ManagedReview | null>(null);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [reviewModalMode, setReviewModalMode] =
    useState<ReviewModalMode>("view");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const loadReviews = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setLoadError("Your staff session has expired. Please sign in again.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await getManagedReviews("staff", token);
      setReviewRecords(response.reviews.map(toManagedReview));
      setSummary(response.summary);
      setLoadError("");
    } catch (error) {
      setLoadError(getReviewErrorMessage(error, "Reviews could not be loaded."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadReviews(), 0);
    return () => window.clearTimeout(timer);
  }, [loadReviews]);

  const handleReviewAction = useCallback(
    (review: ManagedReview) => {
      setSelectedReview(review);
      setReviewModalMode(review.action === "Reply" ? "reply" : "view");
      setIsReviewModalOpen(true);
    },
    [],
  );

  const handleCloseReview = useCallback(() => {
    setIsReviewModalOpen(false);
    setSelectedReview(null);
  }, []);

  const handleSendReply = useCallback(
    async (review: ManagedReview, replyText: string) => {
      const token = getAuthToken();
      if (!token) return;
      try {
        await sendStaffReviewResponse(token, review.id, replyText);
        await loadReviews();
        handleCloseReview();
      } catch (error) {
        setLoadError(getReviewErrorMessage(error, "The staff response could not be saved."));
      }
    },
    [handleCloseReview, loadReviews],
  );

  const handleFlagReview = useCallback(async (review: ManagedReview) => {
    const token = getAuthToken();
    if (!token) return;
    try {
      await flagStaffReview(token, review.id, "Flagged by Staff for Admin review.");
      await loadReviews();
      handleCloseReview();
    } catch (error) {
      setLoadError(getReviewErrorMessage(error, "The review could not be flagged."));
    }
  }, [handleCloseReview, loadReviews]);

  const columns: Column<ManagedReview>[] = useMemo(
    () => [
      {
        label: "Customer",
        render: (row) => (
          <span>
            <b className="text-[#0B1930]">{row.customer}</b>
          </span>
        ),
        search: (row) => row.customer,
      },
      {
        label: "Product",
        render: (row) => row.product,
        search: (row) => row.product,
      },
      {
        label: "Rating",
        render: (row) => <ReviewRating rating={row.rating} />,
      },
      {
        label: "Review",
        render: (row) => (
          <span className="block max-w-60 truncate">{row.review}</span>
        ),
        search: (row) => row.review,
      },
      {
        label: "Branch",
        render: (row) => row.branch,
        search: (row) => row.branch,
      },
      {
        label: "Status",
        render: (row) => <Badge>{row.status}</Badge>,
        search: (row) => row.status,
      },
      { label: "Date", render: (row) => row.date },
      {
        label: "Action",
        render: (row) => (
          <ActionButton
            label={row.action}
            icon={
              row.action === "Reply"
                ? faReply
                : row.action === "Review Flag"
                  ? faFlag
                  : faEye
            }
            onClick={() => handleReviewAction(row)}
          />
        ),
      },
    ],
    [handleReviewAction],
  );
  return (
    <div className="space-y-5">
      <StaffPageHeader
        eyebrow="Review Monitoring"
        title="Customer Reviews"
        description="Monitor customer feedback, respond to reviews, and flag reviews that need Admin attention."
      />
      <Summary
        items={[
          [String(summary.total), "Total Reviews", "Reviews for your branch"],
          [summary.average_rating.toFixed(1), "Average Rating", "Published reviews"],
          [String(summary.awaiting_reply), "Awaiting Reply", "Need staff response"],
          [String(summary.needs_admin_review), "Needs Admin Review", "Flagged or inappropriate"],
        ]}
      />
      {loadError ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{loadError}</p> : null}
      <PortalTable
        title="Review List"
        description={isLoading ? "Loading reviews…" : `${reviewRecords.length} customer reviews`}
        rows={reviewRecords}
        columns={columns}
        tabs={["All", "Published", "Pending Review", "Flagged", "Hidden"]}
        tabValue={(row, tab) => row.status === tab}
      />
      <StaffReviewDetailsModal
        key={`${selectedReview?.id ?? "closed"}-${reviewModalMode}`}
        isOpen={isReviewModalOpen}
        review={selectedReview}
        mode={reviewModalMode}
        reply={selectedReview?.response ?? undefined}
        onClose={handleCloseReview}
        onSendReply={handleSendReply}
        onFlagReview={handleFlagReview}
      />
    </div>
  );
}
