import type { CustomerNotification } from "@/lib/notifications/notificationApi";
import NotificationIcon from "./NotificationIcon";

function formatRelativeTime(value: string | null): string {
  if (!value) return "Recently";
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

export default function NotificationCard({
  notification,
  onClick,
  compact = false,
}: {
  notification: CustomerNotification;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      className={`site-notification-item${
        notification.read ? " is-read" : " is-unread"
      }${compact ? " is-compact" : ""}`}
      onClick={onClick}
    >
      <span className="site-notification-icon" aria-hidden="true">
        <NotificationIcon category={notification.category} />
      </span>
      <span className="site-notification-copy">
        <strong>{notification.title}</strong>
        <span>{notification.message}</span>
        <small>{formatRelativeTime(notification.created_at)}</small>
      </span>
      {!notification.read ? (
        <span className="site-notification-unread-dot" aria-label="Unread" />
      ) : null}
    </button>
  );
}
