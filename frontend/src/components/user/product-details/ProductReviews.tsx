"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faStar } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/components/auth/AuthProvider";

type ProductReview = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
};

const initialReviews: ProductReview[] = [
  {
    id: "review-1",
    author: "Mark Reyes",
    rating: 5,
    comment:
      "The part arrived in good condition and the fit was easy to confirm with ALD staff.",
    date: "2 weeks ago",
  },
  {
    id: "review-2",
    author: "Angela Cruz",
    rating: 4,
    comment:
      "Helpful service and clear updates while I was checking compatibility for my motorcycle.",
    date: "1 month ago",
  },
  {
    id: "review-3",
    author: "Paolo Santos",
    rating: 5,
    comment:
      "Good quality product and a smooth pickup request from the branch.",
    date: "1 month ago",
  },
];

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
}: {
  productName: string;
}) {
  const { isLoading: isAuthLoading, user } = useAuth();
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews);
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [formError, setFormError] = useState("");

  const averageRating = reviews.length
    ? (
        reviews.reduce((total, review) => total + review.rating, 0) /
        reviews.length
      ).toFixed(1)
    : "0.0";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedComment = comment.trim();

    if (!user) {
      return;
    }

    if (!trimmedComment) {
      setFormError("Write a comment before posting your review.");
      return;
    }

    setReviews((currentReviews) => [
      {
        id: `review-${Date.now()}`,
        author: user.name,
        rating: Number(rating),
        comment: trimmedComment,
        date: "Just now",
      },
      ...currentReviews,
    ]);
    setComment("");
    setRating("5");
    setFormError("");
  };

  return (
    <section
      className="product-details-reviews"
      aria-labelledby="product-details-reviews-title"
    >
      <div className="product-details-section-heading">
        <p className="product-details-section-eyebrow">Customer feedback</p>
        <h2 id="product-details-reviews-title">Reviews &amp; Ratings</h2>
        <p className="product-details-review-intro">
          See what customers are saying about products and service from ALD
          Motorshop.
        </p>
      </div>

      <div className="product-details-review-summary">
        <div className="product-details-review-average">
          <strong>{averageRating}</strong>
          <ReviewStars rating={Math.round(Number(averageRating))} />
          <span>Based on {reviews.length} reviews</span>
        </div>
        <p>
          Reviews are currently shown as a frontend preview. New comments are
          visible in this session only.
        </p>
      </div>

      <div className="product-details-review-list">
        {reviews.map((review) => (
          <article className="product-details-review" key={review.id}>
            <header className="product-details-review-header">
              <div className="product-details-review-author">
                <span aria-hidden="true">
                  {review.author.charAt(0).toUpperCase()}
                </span>
                <div>
                  <h3>{review.author}</h3>
                  <p>{review.date}</p>
                </div>
              </div>
              <div className="product-details-review-rating">
                <ReviewStars rating={review.rating} />
              </div>
            </header>
            <p className="product-details-review-comment">{review.comment}</p>
          </article>
        ))}
      </div>

      <div className="product-details-review-form-wrap">
        {isAuthLoading ? (
          <p className="product-details-review-auth-note" role="status">
            Checking your sign-in status…
          </p>
        ) : user ? (
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

            <div className="product-details-review-form-actions">
              <p>For now, your comment is kept in this browser session.</p>
              <button type="submit">
                <FontAwesomeIcon icon={faPaperPlane} aria-hidden="true" />
                Post Review
              </button>
            </div>
          </form>
        ) : (
          <div className="product-details-review-auth-note">
            <div>
              <h3>Want to share a review?</h3>
              <p>Sign in to comment on this product.</p>
            </div>
            <Link href="/auth/login">Sign In to Review</Link>
          </div>
        )}
      </div>
    </section>
  );
}
