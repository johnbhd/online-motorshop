import type {
  AdminDeliveryRequestDetailsResponse,
  AdminDeliveryRequestListResponse,
} from "./adminDeliveryRequestTypes";

export class AdminDeliveryRequestsApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly payload?: unknown,
  ) {
    super(message);
    this.name = "AdminDeliveryRequestsApiError";
  }
}

type Query = {
  search?: string;
  branchId?: number | "";
  assignedStaffId?: number | "";
  status?: string;
  page?: number;
  perPage?: number;
  signal?: AbortSignal;
};

export function getAdminDeliveryRequests(token: string, query: Query = {}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries({
    search: query.search,
    branch_id: query.branchId,
    assigned_staff_id: query.assignedStaffId,
    status: query.status,
    page: query.page,
    per_page: query.perPage,
  })) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }

  return request<AdminDeliveryRequestListResponse>(
    `/api/admin/delivery-requests${params.size ? `?${params}` : ""}`,
    token,
    { signal: query.signal },
  );
}

export function getAdminDeliveryRequest(
  token: string,
  id: number,
  signal?: AbortSignal,
) {
  return request<AdminDeliveryRequestDetailsResponse>(
    `/api/admin/delivery-requests/${id}`,
    token,
    { signal },
  );
}

export function getAdminDeliveryRequestsErrorMessage(error: unknown) {
  if (error instanceof AdminDeliveryRequestsApiError) {
    if (error.status === 401) return "Your Admin session has expired. Please sign in again.";
    if (error.status === 403) return "You are not authorized to oversee delivery requests.";
    if (error.status >= 500) return "The Admin Delivery Requests service is unavailable. Please try again.";
    return error.message;
  }

  return error instanceof Error && error.message
    ? error.message
    : "Unable to load Admin Delivery Requests.";
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
    throw new AdminDeliveryRequestsApiError(502, "The Admin Delivery Requests service could not be reached.", error);
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
      : `Admin Delivery Requests request failed with status ${response.status}.`;
    throw new AdminDeliveryRequestsApiError(response.status, message, payload);
  }

  return payload as T;
}
