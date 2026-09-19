import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxOpen } from "@fortawesome/free-solid-svg-icons";

type CurrentOrderStatusProps = {
  status: string;
  description: string;
};

export default function CurrentOrderStatus({
  status,
  description,
}: CurrentOrderStatusProps) {
  return (
    <section
      className="track-order-current-status"
      aria-labelledby="track-order-current-status-title"
    >
      <div className="track-order-current-status-icon" aria-hidden="true">
        <FontAwesomeIcon icon={faBoxOpen} />
      </div>
      <div>
        <p className="track-order-section-eyebrow">CURRENT STATUS</p>
        <h2 id="track-order-current-status-title">Current Status</h2>
        <p className="track-order-current-status-value">{status}</p>
        <p>{description}</p>
      </div>
    </section>
  );
}
