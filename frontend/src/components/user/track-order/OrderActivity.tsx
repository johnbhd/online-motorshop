import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faClock } from "@fortawesome/free-solid-svg-icons";
import type { TrackOrderActivity as TrackOrderActivityItem } from "./trackOrderTypes";

type OrderActivityProps = {
  activity: TrackOrderActivityItem[];
};

export default function OrderActivity({ activity }: OrderActivityProps) {
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
      <ol className="track-order-activity-list">
        {activity.map((item) => (
          <li
            className="track-order-activity-item"
            data-state={item.state}
            key={`${item.title}-${item.timestamp}`}
          >
            <span className="track-order-activity-marker" aria-hidden="true">
              <FontAwesomeIcon
                icon={item.state === "current" ? faClock : faCheck}
              />
            </span>
            <div>
              <div className="track-order-activity-title-row">
                <h3>{item.title}</h3>
                <time dateTime={item.dateTime}>{item.timestamp}</time>
              </div>
              <p>{item.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
