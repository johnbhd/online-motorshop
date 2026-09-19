import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faClock } from "@fortawesome/free-solid-svg-icons";
import type { OrderActivity as OrderActivityItem } from "@/lib/orders/orderTypes";
import { formatOrderTimestamp } from "../checkout/checkoutUtils";

type OrderActivityProps = {
  activity: OrderActivityItem[];
};

export default function OrderActivity({ activity }: OrderActivityProps) {
  const orderedActivity = [...activity].sort((first, second) => {
    return second.createdAt.localeCompare(first.createdAt);
  });

  return (
    <section
      className="track-order-card track-order-activity-card"
      aria-labelledby="track-order-activity-title"
    >
      <div className="track-order-section-heading">
        <div>
          <p className="track-order-section-eyebrow">REQUEST HISTORY</p>
          <h2 id="track-order-activity-title">Order Activity</h2>
        </div>
      </div>
      {orderedActivity.length > 0 ? (
        <ol className="track-order-activity-list">
          {orderedActivity.map((item, index) => {
            const isCurrent = index === 0;

            return (
              <li
                className="track-order-activity-item"
                data-state={isCurrent ? "current" : "complete"}
                key={item.id}
              >
                <span className="track-order-activity-marker" aria-hidden="true">
                  <FontAwesomeIcon icon={isCurrent ? faClock : faCheck} />
                </span>
                <div>
                  <div className="track-order-activity-title-row">
                    <h3>{item.title}</h3>
                    <time dateTime={item.createdAt}>
                      {formatOrderTimestamp(item.createdAt)}
                    </time>
                  </div>
                  <p>{item.message}</p>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="track-order-empty-activity">No activity recorded yet.</p>
      )}
    </section>
  );
}
