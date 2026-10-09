import type { AdminOrderDetailResponse, AdminOrderListResponse } from "./adminOrderTypes";

export class AdminOrdersApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "AdminOrdersApiError";
    this.status = status;
    this.payload = payload;
  }
}

type Query = {
  search?: string;
  branchId?: number | "";
  status?: string;
  fulfillment?: string;
  paymentStatus?: string;
  assignedStaffId?: number | "";
  page?: number;
  perPage?: number;
  signal?: AbortSignal;
};

export function getAdminOrders(token: string, query: Query = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({
    search: query.search,
    branch_id: query.branchId,
    status: query.status,
    fulfillment: query.fulfillment,
    payment_status: query.paymentStatus,
    assigned_staff_id: query.assignedStaffId,
    page: query.page,
    per_page: query.perPage,
  })) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }

  return request<AdminOrderListResponse>(`/api/admin/orders${params.size ? `?${params}` : ""}`, token, { signal: query.signal });
}

export function getAdminOrder(token: string, reference: string) {
  return request<AdminOrderDetailResponse>(`/api/admin/orders/${encodeURIComponent(reference)}`, token);
}

export function updateAdminOrderStatus(token: string, reference: string, status: string) {
  return mutate<AdminOrderDetailResponse>(token, `/api/admin/orders/${encodeURIComponent(reference)}/status`, { status });
}

export function updateAdminOrderAssignment(token: string, reference: string, staffId: number | null) {
  return mutate<AdminOrderDetailResponse>(token, `/api/admin/orders/${encodeURIComponent(reference)}/assignment`, { staff_id: staffId });
}

export function getAdminOrdersErrorMessage(error: unknown) {
  if (error instanceof AdminOrdersApiError) {
    if (error.status === 401) return "Your Admin session has expired. Please sign in again.";
    if (error.status === 403) return "You are not authorized to oversee orders.";
    if (error.status >= 500) return "The Admin Orders service is unavailable. Please try again.";
    return error.message;
  }
  return error instanceof Error && error.message ? error.message : "Unable to load Admin Orders.";
}

async function mutate<T>(token: string, url: string, payload: unknown) {
  return request<T>(url, token, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
}

async function request<T>(url: string, token: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: { Accept: "application/json", Authorization: `Bearer ${token}`, ...init.headers },
    cache: "no-store",
  });
  const text = await response.text();
  let payload: unknown = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  if (!response.ok) {
    const message = typeof (payload as { message?: unknown } | null)?.message === "string"
      ? (payload as { message: string }).message
      : `Admin Orders request failed with status ${response.status}.`;
    throw new AdminOrdersApiError(response.status, message, payload);
  }
  return payload as T;
}
