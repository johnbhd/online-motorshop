"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { OPEN_STAFF_CHAT_EVENT } from "@/components/user/chatbot/chatbotEvents";
import type { CustomerNotification } from "@/lib/notifications/notificationApi";
import NotificationCard from "./NotificationCard";

export default function NotificationDropdown({
  id,
  isMobile = false,
  notifications,
  unreadCount,
  isLoading,
  error,
  onRefresh,
  onMarkRead,
  onMarkAllRead,
  onClose,
}: {
  id: string;
  isMobile?: boolean;
  notifications: CustomerNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string;
  onRefresh: () => void;
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  onClose: () => void;
}) {
  const router = useRouter();
  const openNotification = async (notification: CustomerNotification) => {
    await onMarkRead(notification.id);
    onClose();
    if (
      notification.reference.type === "order" &&
      notification.reference.order_reference
    ) {
      router.push(`/account/orders/${encodeURIComponent(notification.reference.order_reference)}`);
    } else if (notification.reference.type === "conversation") {
      window.dispatchEvent(new Event(OPEN_STAFF_CHAT_EVENT));
    }
  };

  return (
    <div
      className={
        isMobile
          ? "site-mobile-notifications"
          : "site-header-notifications-menu"
      }
      id={id}
      role="region"
      aria-label="Notifications"
    >
      <div className="site-notifications-heading">
        <strong>Notifications</strong>
        <span>
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        </span>
      </div>
      {isLoading ? (
        <div className="site-notifications-state" aria-live="polite">
          Loading notifications…
        </div>
      ) : error ? (
        <div className="site-notifications-state" role="alert">
          <span>{error}</span>
          <button type="button" onClick={onRefresh}>
            Try again
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="site-notifications-state">No notifications yet.</div>
      ) : (
        <>
          <div className="site-notifications-toolbar">
            {unreadCount > 0 ? (
              <button type="button" onClick={() => void onMarkAllRead()}>
                Mark all as read
              </button>
            ) : null}
            <Link href="/account/notifications" onClick={onClose}>
              View all
            </Link>
          </div>
          <div className="site-notifications-list">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                compact
                onClick={() => void openNotification(notification)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
