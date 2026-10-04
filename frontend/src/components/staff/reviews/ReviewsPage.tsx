"use client";

import { useCallback, useMemo, useState } from "react";
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
import { reviews, type Review } from "@/lib/mock/staff";
import ReviewRating from "./ReviewRating";
import StaffReviewDetailsModal, {
  type ReviewModalMode,
  type StaffReviewReply,
} from "./StaffReviewDetailsModal";

function getReviewKey(review: Review) {
  return `${review.customer}:${review.product}:${review.date}`;
}

export default function ReviewsPage() {
  const [reviewRecords, setReviewRecords] = useState<Review[]>(reviews);
  const [reviewReplies, setReviewReplies] = useState<
    Record<string, StaffReviewReply>
  >({});
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [reviewModalMode, setReviewModalMode] =
    useState<ReviewModalMode>("view");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const handleReviewAction = useCallback(
    (review: Review) => {
      const hasReply = Boolean(reviewReplies[getReviewKey(review)]);

      setSelectedReview(review);
      setReviewModalMode(
        review.action === "Reply" && !hasReply ? "reply" : "view",
      );
      setIsReviewModalOpen(true);
    },
    [reviewReplies],
  );

  const handleCloseReview = useCallback(() => {
    setIsReviewModalOpen(false);
    setSelectedReview(null);
  }, []);

  const handleSendReply = useCallback(
    (review: Review, replyText: string) => {
      const reviewKey = getReviewKey(review);

      setReviewReplies((currentReplies) => ({
        ...currentReplies,
        [reviewKey]: {
          text: replyText,
          author: "ALD Staff",
          repliedAt: new Date().toISOString(),
        },
      }));
      setReviewRecords((currentReviews) =>
        currentReviews.map((currentReview) =>
          getReviewKey(currentReview) === reviewKey
            ? { ...currentReview, action: "View Review" }
            : currentReview,
        ),
      );
      handleCloseReview();
    },
    [handleCloseReview],
  );

  const columns: Column<Review>[] = useMemo(
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
  const selectedReviewKey = selectedReview
    ? getReviewKey(selectedReview)
    : "closed";

  return (
    <div className="space-y-5">
      <StaffPageHeader
        eyebrow="Review Monitoring"
        title="Customer Reviews"
        description="Monitor customer feedback, respond to reviews, and flag reviews that need Admin attention."
      />
      <Summary
        items={[
          ["86", "Total Reviews", "All customer reviews"],
          ["4.6", "Average Rating", "Out of 5 stars"],
          ["7", "Awaiting Reply", "Need staff response"],
          ["3", "Needs Admin Review", "Flagged or inappropriate"],
        ]}
      />
      <PortalTable
        title="Review List"
        description="86 customer reviews"
        rows={reviewRecords}
        columns={columns}
        tabs={["All", "Published", "Pending Review", "Flagged", "Hidden"]}
        tabValue={(row, tab) => row.status === tab}
      />
      <StaffReviewDetailsModal
        key={`${selectedReviewKey}-${reviewModalMode}`}
        isOpen={isReviewModalOpen}
        review={selectedReview}
        mode={reviewModalMode}
        reply={
          selectedReview
            ? reviewReplies[getReviewKey(selectedReview)]
            : undefined
        }
        onClose={handleCloseReview}
        onSendReply={handleSendReply}
      />
    </div>
  );
}
