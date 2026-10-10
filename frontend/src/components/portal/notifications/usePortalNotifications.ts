"use client";

import { useCallback, useEffect, useState } from "react";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getPortalNotificationErrorMessage,
  getPortalNotifications,
  markAllPortalNotificationsRead,
  markPortalNotificationRead,
  type PortalNotification,
  type PortalNotificationCategory,
  type PortalNotificationResponse,
  type PortalRole,
} from "@/lib/portalNotifications/portalNotificationApi";

export function usePortalNotifications(
  role: PortalRole,
  options: { category?: PortalNotificationCategory; page?: number; perPage?: number } = {},
) {
  const category = options.category ?? "all";
  const page = options.page ?? 1;
  const perPage = options.perPage ?? 10;
  const [data, setData] = useState<PortalNotificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    const token = getAuthToken();
    if (!token) {
      setData(null);
      setError("Your session has expired. Please sign in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      setData(await getPortalNotifications(token, role, { category, page, perPage, signal }));
      setError(null);
    } catch (loadError) {
      if (loadError instanceof Error && loadError.name === "AbortError") return;
      setError(getPortalNotificationErrorMessage(loadError));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [category, page, perPage, role]);

  useEffect(() => {
    const controller = new AbortController();
    const initialLoad = window.setTimeout(() => void load(controller.signal), 0);
    const refresh = () => void load(controller.signal);
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => {
      controller.abort();
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [load]);

  const markRead = useCallback(async (notification: PortalNotification) => {
    const token = getAuthToken();
    if (!token || notification.read) return;
    const response = await markPortalNotificationRead(token, role, notification.id);
    setData((current) => current ? {
      ...current,
      unread_count: response.unread_count,
      notifications: current.notifications.map((item) => item.id === notification.id ? response.notification : item),
    } : current);
  }, [role]);

  const markAllRead = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    const response = await markAllPortalNotificationsRead(token, role);
    setData((current) => current ? {
      ...current,
      unread_count: response.unread_count,
      notifications: current.notifications.map((item) => ({ ...item, read: true, read_at: new Date().toISOString() })),
    } : current);
  }, [role]);

  return {
    notifications: data?.notifications ?? [],
    unreadCount: data?.unread_count ?? 0,
    meta: data?.meta ?? { current_page: page, last_page: 1, per_page: perPage, total: 0 },
    loading,
    error,
    reload: load,
    markRead,
    markAllRead,
  };
}
