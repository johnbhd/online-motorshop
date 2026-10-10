export type PortalRole = "staff" | "admin";

export type PortalNotificationCategory =
  | "all"
  | "unread"
  | "orders"
  | "assignments"
  | "payments"
  | "pickup"
  | "delivery"
  | "messages"
  | "attention";

export type PortalNotification = {
  id: string;
  type: string;
  category: Exclude<PortalNotificationCategory, "all" | "unread">;
  title: string;
  message: string;
  read: boolean;
  read_at: string | null;
  created_at: string | null;
  reference: {
    type: string | null;
    order_id: number | null;
    order_reference: string | null;
    payment_id: number | null;
    pickup_id: number | null;
    delivery_id: number | null;
    conversation_id: number | null;
    branch_id: number | null;
  };
};

export type PortalNotificationResponse = {
  notifications: PortalNotification[];
  unread_count: number;
  meta: { current_page: number; last_page: number; per_page: number; total: number };
};

export class PortalNotificationApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "PortalNotificationApiError";
    this.status = status;
  }
}

async function readBody(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  if (!text) return {};
  try {
    const body = JSON.parse(text) as unknown;
    return typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

async function request<T>(path: string, token: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(path, { ...options, headers, cache: "no-store" });
  const body = await readBody(response);
  if (!response.ok) {
    throw new PortalNotificationApiError(
      response.status,
      typeof body.message === "string" ? body.message : "Notifications are unavailable right now.",
    );
  }
  return body as T;
}

function basePath(role: PortalRole) {
  return `/api/${role}/notifications`;
}

export function getPortalNotifications(token: string, role: PortalRole, options: { category?: PortalNotificationCategory; page?: number; perPage?: number; signal?: AbortSignal } = {}) {
  const query = new URLSearchParams();
  if (options.category) query.set("category", options.category);
  if (options.page) query.set("page", String(options.page));
  if (options.perPage) query.set("per_page", String(options.perPage));
  return request<PortalNotificationResponse>(`${basePath(role)}${query.size ? `?${query.toString()}` : ""}`, token, { signal: options.signal });
}

export function markPortalNotificationRead(token: string, role: PortalRole, id: string) {
  return request<{ notification: PortalNotification; unread_count: number }>(`${basePath(role)}/${encodeURIComponent(id)}/read`, token, { method: "PATCH" });
}

export function markAllPortalNotificationsRead(token: string, role: PortalRole) {
  return request<{ updated: number; unread_count: number }>(`${basePath(role)}/read-all`, token, { method: "PATCH" });
}

export function getPortalNotificationErrorMessage(error: unknown) {
  return error instanceof PortalNotificationApiError && error.message ? error.message : "We could not load notifications. Please try again.";
}
