import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import type { TrackOrderProgressStep } from "./trackOrderTypes";

type OrderProgressTrackerProps = {
  steps: TrackOrderProgressStep[];
};

export default function OrderProgressTracker({ steps }: OrderProgressTrackerProps) {
  return (
    <section
      className="track-order-card track-order-progress-card"
      aria-labelledby="track-order-progress-title"
    >
      <div className="track-order-section-heading track-order-progress-heading">
        <div>
          <p className="track-order-section-eyebrow">ORDER JOURNEY</p>
          <h2 id="track-order-progress-title">Order Progress</h2>
        </div>
        <span className="track-order-progress-caption">4 of 6 stages</span>
      </div>
      <ol className="track-order-progress-list">
        {steps.map((step) => (
          <li
            className="track-order-progress-step"
            data-state={step.state}
            key={step.label}
            aria-current={step.state === "current" ? "step" : undefined}
          >
            <span className="track-order-progress-marker" aria-hidden="true">
              {step.state === "complete" ? (
                <FontAwesomeIcon icon={faCheck} />
              ) : null}
            </span>
            <span className="track-order-progress-label">{step.label}</span>
            <span className="track-order-visually-hidden">
              {step.state === "complete"
                ? "Completed"
                : step.state === "current"
                  ? "Current stage"
                  : "Not started"}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
