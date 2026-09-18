import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faFileLines } from "@fortawesome/free-solid-svg-icons";
import type { TrackOrderData } from "./trackOrderTypes";

type OrderRequestSummaryProps = {
  order: TrackOrderData;
};

export default function OrderRequestSummary({ order }: OrderRequestSummaryProps) {
  return (
    <section
      className="track-order-card track-order-request-summary"
      aria-labelledby="track-order-summary-title"
    >
      <div className="track-order-section-heading">
        <div>
          <p className="track-order-section-eyebrow">REQUEST DETAILS</p>
          <h2 id="track-order-summary-title">Order Request Summary</h2>
        </div>
        <span className="track-order-status-badge">
          <FontAwesomeIcon icon={faCircleCheck} aria-hidden="true" />
          <span>{order.status}</span>
        </span>
      </div>
      <div className="track-order-request-details">
        <div>
          <span>Reference Number</span>
          <strong>{order.reference}</strong>
        </div>
        <div>
          <span>Submitted</span>
          <strong>{order.submittedAt}</strong>
        </div>
        <div>
          <span>Fulfillment</span>
          <strong>{order.fulfillmentMethod}</strong>
        </div>
        <div>
          <span>Branch</span>
          <strong>{order.branchName}</strong>
        </div>
      </div>
      <p className="track-order-demo-note">
        <FontAwesomeIcon icon={faFileLines} aria-hidden="true" />
        <span>
          Sample order request for this UI demonstration. No live order record
          is being looked up.
        </span>
      </p>
    </section>
  );
}
