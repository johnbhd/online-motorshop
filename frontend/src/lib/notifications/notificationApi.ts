export type NotificationCategory =
  | "all"
  | "unread"
  | "orders"
  | "payments"
  | "support";

export type CustomerNotification = {
  id: string;
  type: string;
  category: Exclude<NotificationCategory, "all" | "unread">;
  title: string;
  message: string;
  read: boolean;
  read_at: string | null;
  created_at: string | null;
  reference: {
    type: "order" | "conversation" | null;
    order_id: number | null;
    order_reference: string | null;
    conversation_id: number | null;
  };
};

export type NotificationPagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type CustomerNotificationsResponse = {
  notifications: CustomerNotification[];
  unread_count: number;
  meta: NotificationPagination;
};

export class NotificationApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "NotificationApiError";
    this.status = status;
  }
}

async function readBody(
  response: Response,
): Promise<Record<string, unknown>> {
  const text = await response.text();
  if (!text) return {};

  try {
    const body = JSON.parse(text) as unknown;
    return typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

async function notificationRequest<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(path, {
    ...options,
    headers,
    cache: "no-store",
  });
  const body = await readBody(response);

  if (!response.ok) {
    const message =
      typeof body.message === "string"
        ? body.message
        : "Notifications are unavailable right now.";

    throw new NotificationApiError(response.status, message);
  }

  return body as T;
}

export function getCustomerNotifications(
  token: string,
  options: {
    category?: NotificationCategory;
    page?: number;
    perPage?: number;
    signal?: AbortSignal;
  } = {},
) {
  const query = new URLSearchParams();
  if (options.category) query.set("category", options.category);
  if (options.page) query.set("page", String(options.page));
  if (options.perPage) query.set("per_page", String(options.perPage));

  return notificationRequest<CustomerNotificationsResponse>(
    `/api/customer/notifications?${query.toString()}`,
    token,
    { signal: options.signal },
  );
}

export function markCustomerNotificationRead(token: string, id: string) {
  return notificationRequest<{
    notification: CustomerNotification;
    unread_count: number;
  }>(
    `/api/customer/notifications/${encodeURIComponent(id)}/read`,
    token,
    { method: "PATCH" },
  );
}

export function markAllCustomerNotificationsRead(token: string) {
  return notificationRequest<{ updated: number; unread_count: number }>(
    "/api/customer/notifications/read-all", token, { method: "PATCH" },
  );
}

export function getNotificationErrorMessage(
  error: unknown,
  fallback = "We could not load your notifications. Please try again.",
) {
  return error instanceof NotificationApiError && error.message ? error.message : fallback;
}
