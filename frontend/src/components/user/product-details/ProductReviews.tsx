"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faStar } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getProductReviews,
  getReviewEligibility,
  getReviewErrorMessage,
  submitProductReview,
  type ProductReview,
  type ReviewSummary,
} from "@/lib/reviews/reviewApi";

function ReviewStars({ rating }: { rating: number }) {
  return (
    <span
      className="product-details-review-stars"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <FontAwesomeIcon
          key={index}
          icon={faStar}
          className={index < rating ? "is-filled" : ""}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export default function ProductReviews({
  productName,
  partNumber,
}: {
  productName: string;
  partNumber: string;
}) {
  const { isLoading: isAuthLoading, user } = useAuth();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    reason: string | null;
    existing_review: ProductReview | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    getProductReviews(partNumber, controller.signal)
      .then((response) => {
        setReviews(response.reviews);
        setSummary(response.summary);
        setError("");
      })
      .catch((loadError) => {
        if (!controller.signal.aborted) {
          setError(getReviewErrorMessage(loadError, "Reviews could not be loaded right now."));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [partNumber]);

  useEffect(() => {
    const token = getAuthToken();

    if (isAuthLoading || !user || !token) {
      return;
    }

    getReviewEligibility(partNumber, token)
      .then(setEligibility)
      .catch((eligibilityError) => {
        setFormError(
          getReviewErrorMessage(
            eligibilityError,
            "Review eligibility is unavailable right now.",
          ),
        );
      });
  }, [isAuthLoading, partNumber, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedComment = comment.trim();
    const token = getAuthToken();

    if (!user || !token) return;

    if (!trimmedComment) {
      setFormError("Write a comment before posting your review.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    try {
      await submitProductReview(partNumber, token, {
        rating: Number(rating),
        review_text: trimmedComment,
      });
      setComment("");
      setRating("5");
      setEligibility({ eligible: false, reason: "already_reviewed", existing_review: null });
      setSuccessMessage("Your review was submitted and is waiting for moderation.");
    } catch (submitError) {
      setFormError(getReviewErrorMessage(submitError, "We could not submit your review."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const averageRating = summary?.average_rating ?? 0;

  return (
    <section
      className="product-details-reviews"
      aria-labelledby="product-details-reviews-title"
    >
      <div className="product-details-section-heading">
        <p className="product-details-section-eyebrow">Customer feedback</p>
        <h2 id="product-details-reviews-title">Reviews &amp; Ratings</h2>
        <p className="product-details-review-intro">
          See published customer feedback about products and service from ALD
          Motorshop.
        </p>
      </div>

      <div className="product-details-review-summary">
        <div className="product-details-review-average">
          <strong>{averageRating.toFixed(1)}</strong>
          <ReviewStars rating={Math.round(averageRating)} />
          <span>Based on {summary?.published ?? 0} reviews</span>
        </div>
        <p>Reviews are published after ALD moderation.</p>
      </div>

      {isLoading ? (
        <p className="product-details-review-auth-note" role="status">
          Loading reviews…
        </p>
      ) : null}
      {error ? (
        <p className="product-details-review-form-error" role="alert">
          {error}
        </p>
      ) : null}
      {!isLoading && !error && reviews.length === 0 ? (
        <p className="product-details-review-auth-note">No published reviews yet.</p>
      ) : null}

      <div className="product-details-review-list">
        {reviews.map((review) => (
          <article className="product-details-review" key={review.id}>
            <header className="product-details-review-header">
              <div className="product-details-review-author">
                <span aria-hidden="true">
                  {review.customer.initials}
                </span>
                <div>
                  <h3>{review.customer.name}</h3>
                  <p>{review.published_at ?? review.created_at ?? ""}</p>
                </div>
              </div>
              <div className="product-details-review-rating">
                <ReviewStars rating={review.rating} />
              </div>
            </header>
            <p className="product-details-review-comment">{review.review_text}</p>
            {review.response ? (
              <div className="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <strong className="block text-[#0B1930]">ALD response</strong>
                {review.response.text}
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <div className="product-details-review-form-wrap">
        {isAuthLoading ? (
          <p className="product-details-review-auth-note" role="status">
            Checking your sign-in status…
          </p>
        ) : user ? (
          eligibility === null ? (
            <p className="product-details-review-auth-note" role="status">
              Checking review eligibility…
            </p>
          ) : eligibility.eligible ? (
          <form className="product-details-review-form" onSubmit={handleSubmit}>
            <div className="product-details-review-form-heading">
              <div>
                <p className="product-details-section-eyebrow">Your review</p>
                <h3>Share your experience</h3>
              </div>
              <span>Signed in as {user.name}</span>
            </div>

            <div className="product-details-review-fields">
              <label htmlFor="product-review-rating">
                Rating
                <select
                  id="product-review-rating"
                  value={rating}
                  onChange={(event) => setRating(event.target.value)}
                >
                  <option value="5">5 stars — Excellent</option>
                  <option value="4">4 stars — Good</option>
                  <option value="3">3 stars — Okay</option>
                  <option value="2">2 stars — Needs improvement</option>
                  <option value="1">1 star — Poor</option>
                </select>
              </label>
              <label htmlFor="product-review-comment">
                Comment
                <textarea
                  id="product-review-comment"
                  value={comment}
                  onChange={(event) => {
                    setComment(event.target.value);
                    setFormError("");
                  }}
                  placeholder={`Tell us about your experience with ${productName}`}
                  rows={4}
                  required
                />
              </label>
            </div>

            {formError ? (
              <p className="product-details-review-form-error" role="alert">
                {formError}
              </p>
            ) : null}
            {successMessage ? (
              <p className="product-details-review-auth-note" role="status">
                {successMessage}
              </p>
            ) : null}

            <div className="product-details-review-form-actions">
              <p>Your review will be visible after moderation.</p>
              <button type="submit" disabled={isSubmitting}>
                <FontAwesomeIcon icon={faPaperPlane} aria-hidden="true" />
                {isSubmitting ? "Submitting…" : "Post Review"}
              </button>
            </div>
          </form>
          ) : (
            <p className="product-details-review-auth-note">
              {eligibility?.reason === "already_reviewed"
                ? "You have already reviewed this product."
                : "A completed purchase is required before reviewing this product."}
            </p>
          )
        ) : (
          <div className="product-details-review-auth-note">
            <div>
              <h3>Want to share a review?</h3>
              <p>Sign in and complete a purchase to comment on this product.</p>
            </div>
            <Link href="/auth/login">Sign In to Review</Link>
          </div>
        )}
      </div>
    </section>
  );
}
