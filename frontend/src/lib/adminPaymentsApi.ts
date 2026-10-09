import type {
  AdminPaymentDetailsResponse,
  AdminPaymentListResponse,
  AdminPaymentStatusResponse,
} from "./adminPaymentTypes";

export class AdminPaymentsApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "AdminPaymentsApiError";
    this.status = status;
    this.payload = payload;
  }
}

type Query = {
  search?: string;
  branchId?: number | "";
  method?: string;
  status?: string;
  fulfillment?: string;
  page?: number;
  perPage?: number;
  signal?: AbortSignal;
};

export function getAdminPayments(token: string, query: Query = {}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries({
    search: query.search,
    branch_id: query.branchId,
    method: query.method,
    status: query.status,
    fulfillment: query.fulfillment,
    page: query.page,
    per_page: query.perPage,
  })) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  return request<AdminPaymentListResponse>(
    `/api/admin/payments${params.size ? `?${params}` : ""}`,
    token,
    { signal: query.signal },
  );
}

export function getAdminPayment(token: string, id: number) {
  return request<AdminPaymentDetailsResponse>(`/api/admin/payments/${id}`, token);
}

export function updateAdminPaymentStatus(token: string, id: number, status: string) {
  return request<AdminPaymentStatusResponse>(`/api/admin/payments/${id}/status`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export function getAdminPaymentsErrorMessage(error: unknown): string {
  if (error instanceof AdminPaymentsApiError) {
    if (error.status === 401) return "Your Admin session has expired. Please sign in again.";
    if (error.status === 403) return "You are not authorized to oversee payments.";
    if (error.status >= 500) return "The Admin Payments service is unavailable. Please try again.";
    return error.message;
  }

  return error instanceof Error && error.message
    ? error.message
    : "Unable to load Admin Payments.";
}

async function request<T>(url: string, token: string, init: RequestInit = {}) {
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new AdminPaymentsApiError(502, "The Admin Payments service could not be reached.", error);
  }

  const text = await response.text();
  let payload: unknown = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    const message = typeof (payload as { message?: unknown } | null)?.message === "string"
      ? (payload as { message: string }).message
      : `Admin Payments request failed with status ${response.status}.`;
    throw new AdminPaymentsApiError(response.status, message, payload);
  }

  return payload as T;
}
