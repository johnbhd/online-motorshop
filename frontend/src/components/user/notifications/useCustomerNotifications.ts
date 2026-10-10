"use client";

import { useCallback, useEffect, useState } from "react";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getCustomerNotifications,
  getNotificationErrorMessage,
  markAllCustomerNotificationsRead,
  markCustomerNotificationRead,
  type CustomerNotification,
  type NotificationCategory,
  type NotificationPagination,
} from "@/lib/notifications/notificationApi";

const initialMeta: NotificationPagination = {
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
};

export function useCustomerNotifications(options: {
  enabled: boolean;
  category?: NotificationCategory;
  page?: number;
  perPage?: number;
}) {
  const { enabled, category = "all", page = 1, perPage = 10 } = options;
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [meta, setMeta] = useState(initialMeta);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState("");

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const token = getAuthToken();
    if (!token) {
      setError("Your session has expired. Please sign in again.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const response = await getCustomerNotifications(token, {
        category,
        page,
        perPage,
        signal,
      });
      if (signal?.aborted) return;
      setNotifications(response.notifications);
      setMeta(response.meta);
      setUnreadCount(response.unread_count);
    } catch (requestError) {
      if (signal?.aborted) return;
      setNotifications([]);
      setError(getNotificationErrorMessage(requestError));
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [category, page, perPage]);

  useEffect(() => {
    if (!enabled) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [enabled, refresh]);

  const markRead = useCallback(async (id: string) => {
    const token = getAuthToken();
    if (!token) return;
    const response = await markCustomerNotificationRead(token, id);
    setNotifications((current) =>
      category === "unread"
        ? current.filter((notification) => notification.id !== id)
        : current.map((notification) =>
            notification.id === id ? response.notification : notification,
          ),
    );
    setUnreadCount(response.unread_count);
  }, [category]);

  const markAllRead = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    const response = await markAllCustomerNotificationsRead(token);
    setNotifications((current) =>
      category === "unread"
        ? []
        : current.map((notification) => ({ ...notification, read: true })),
    );
    setUnreadCount(response.unread_count);
  }, [category]);

  return {
    notifications,
    meta,
    unreadCount,
    isLoading,
    error,
    refresh,
    markRead,
    markAllRead,
  };
}
