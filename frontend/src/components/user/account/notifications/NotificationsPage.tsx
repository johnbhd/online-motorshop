"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { OPEN_STAFF_CHAT_EVENT } from "@/components/user/chatbot/chatbotEvents";
import NotificationCard from "@/components/user/notifications/NotificationCard";
import { useCustomerNotifications } from "@/components/user/notifications/useCustomerNotifications";
import type { NotificationCategory } from "@/lib/notifications/notificationApi";

const filters: Array<{ value: NotificationCategory; label: string }> = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "orders", label: "Orders" },
  { value: "payments", label: "Payments" },
  { value: "support", label: "Support" },
];

export default function NotificationsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [category, setCategory] = useState<NotificationCategory>("all");
  const [page, setPage] = useState(1);
  const isCustomer = user?.role === "customer";
  const notifications = useCustomerNotifications({
    enabled: !isAuthLoading && isCustomer,
    category,
    page,
    perPage: 10,
  });

  const openNotification = async (
    id: string,
    referenceType: string | null,
    orderReference: string | null,
  ) => {
    await notifications.markRead(id);
    if (referenceType === "order" && orderReference) {
      router.push(`/account/orders/${encodeURIComponent(orderReference)}`);
    }
    if (referenceType === "conversation") {
      window.dispatchEvent(new Event(OPEN_STAFF_CHAT_EVENT));
    }
  };

  if (isAuthLoading || !isCustomer) {
    return (
      <div className="customer-notifications-page">
        <section className="customer-orders-loading">
          Loading your notifications…
        </section>
      </div>
    );
  }

  return (
    <div className="customer-notifications-page">
      <section
        className="customer-orders-hero customer-orders-hero--image"
        aria-labelledby="customer-notifications-title"
      >
        <div className="customer-orders-hero-image" aria-hidden="true">
          <Image
            src="/branches/manila.png"
            alt=""
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className="customer-orders-hero-overlay" aria-hidden="true" />
        <div className="customer-orders-shell customer-orders-hero-content">
          <p className="customer-orders-breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span>Notifications</span>
          </p>
          <p className="customer-orders-eyebrow">Customer Account</p>
          <h1 id="customer-notifications-title">Notifications</h1>
          <p>Stay updated on your orders, payments, and support messages.</p>
        </div>
      </section>

      <main className="customer-orders-shell customer-notifications-content">
        <section
          className="customer-orders-panel"
          aria-labelledby="customer-notifications-list-title"
        >
          <div className="customer-orders-panel-header">
            <div>
              <p className="customer-orders-eyebrow">Account updates</p>
              <h2 id="customer-notifications-list-title">
                Your notifications
              </h2>
            </div>
            {notifications.unreadCount > 0 ? (
              <button
                className="customer-orders-primary-link"
                type="button"
                onClick={() => void notifications.markAllRead()}
              >
                Mark all as read
              </button>
            ) : null}
          </div>

          <nav
            className="customer-notifications-filters"
            aria-label="Notification filters"
          >
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={category === filter.value ? "is-active" : ""}
                onClick={() => {
                  setCategory(filter.value);
                  setPage(1);
                }}
              >
                {filter.label}
              </button>
            ))}
          </nav>

          {notifications.isLoading ? (
            <div className="customer-orders-loading">
              Loading notifications…
            </div>
          ) : notifications.error ? (
            <div className="customer-orders-error" role="alert">
              <h2>Notifications unavailable</h2>
              <p>{notifications.error}</p>
              <button
                className="customer-orders-primary-link"
                type="button"
                onClick={() => void notifications.refresh()}
              >
                Try again
              </button>
            </div>
          ) : notifications.notifications.length === 0 ? (
            <div className="customer-notifications-empty">
              <h2>
                {category === "unread"
                  ? "You’re all caught up."
                  : "No notifications yet."}
              </h2>
              <p>Order, payment, and support updates will appear here.</p>
            </div>
          ) : (
            <div className="customer-notifications-list">
              {notifications.notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onClick={() =>
                    void openNotification(
                      notification.id,
                      notification.reference.type,
                      notification.reference.order_reference,
                    )
                  }
                />
              ))}
            </div>
          )}

          {!notifications.isLoading &&
          !notifications.error &&
          notifications.meta.last_page > 1 ? (
            <div className="customer-notifications-pagination">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </button>
              <span>
                Page {notifications.meta.current_page} of {notifications.meta.last_page}
              </span>
              <button
                type="button"
                disabled={page >= notifications.meta.last_page}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
