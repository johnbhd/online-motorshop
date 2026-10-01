import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar as faRegularStar } from "@fortawesome/free-regular-svg-icons";
import { faStar as faSolidStar } from "@fortawesome/free-solid-svg-icons";

type ReviewRatingProps = {
  rating: number;
  showValue?: boolean;
  className?: string;
};

function getSafeRating(rating: number) {
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
    return null;
  }

  return Math.round(rating);
}

export default function ReviewRating({
  rating,
  showValue = false,
  className = "",
}: ReviewRatingProps) {
  const safeRating = getSafeRating(rating);
  const accessibleLabel =
    safeRating === null
      ? "Rating unavailable"
      : `${safeRating} out of 5 stars`;

  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      role="img"
      aria-label={accessibleLabel}
    >
      <span className="inline-flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <FontAwesomeIcon
            key={index}
            icon={
              safeRating !== null && index < safeRating
                ? faSolidStar
                : faRegularStar
            }
            className={
              safeRating !== null && index < safeRating
                ? "text-orange-500"
                : "text-slate-200"
            }
          />
        ))}
      </span>
      {showValue ? (
        <span className="text-sm font-semibold text-slate-600">
          {safeRating === null
            ? "Rating unavailable"
            : `${safeRating} out of 5`}
        </span>
      ) : null}
    </span>
  );
}
