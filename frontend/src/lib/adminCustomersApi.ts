import type {
  AdminCustomerListResponse,
  AdminCustomerMutationResponse,
  AdminCustomerPayload,
  AdminCustomerResponse,
} from "./adminCustomerTypes";

export class AdminCustomersApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "AdminCustomersApiError";
    this.status = status;
    this.payload = payload;
  }
}

type CustomerQuery = {
  search?: string;
  type?: string;
  branchId?: number | "";
  status?: string;
  page?: number;
  perPage?: number;
  orderPerPage?: number;
  signal?: AbortSignal;
};

type ApiErrorPayload = {
  message?: unknown;
  errors?: unknown;
};

export function getAdminCustomers(token: string, query: CustomerQuery = {}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries({
    search: query.search,
    type: query.type,
    branch_id: query.branchId,
    status: query.status,
    page: query.page,
    per_page: query.perPage,
    order_per_page: query.orderPerPage,
  })) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  return request<AdminCustomerListResponse>(
    `/api/admin/customers${params.size ? `?${params}` : ""}`,
    token,
    { signal: query.signal },
  );
}

export function getAdminCustomer(token: string, id: number) {
  return request<AdminCustomerResponse>(`/api/admin/customers/${id}`, token);
}

export function updateAdminCustomer(
  token: string,
  id: number,
  payload: AdminCustomerPayload,
) {
  return mutate<AdminCustomerMutationResponse>(
    token,
    `/api/admin/customers/${id}`,
    "PATCH",
    payload,
  );
}

export function deleteAdminCustomer(token: string, id: number) {
  return mutate<{ message: string }>(
    token,
    `/api/admin/customers/${id}`,
    "DELETE",
  );
}

export function getAdminCustomerErrorMessage(error: unknown): string {
  if (error instanceof AdminCustomersApiError) {
    if (error.status === 401) {
      return "Your Admin session has expired. Please sign in again.";
    }

    if (error.status === 403) {
      return "You are not authorized to manage customer records.";
    }

    if (error.status === 409) {
      return error.message;
    }

    if (error.status >= 500) {
      return "The Admin Customers service is unavailable. Please try again.";
    }

    return error.message;
  }

  return error instanceof Error && error.message
    ? error.message
    : "Unable to complete the customer request.";
}

export function getCustomerValidationErrors(
  error: unknown,
): Record<string, string[]> {
  if (!(error instanceof AdminCustomersApiError)) {
    return {};
  }

  const payload = error.payload as ApiErrorPayload | null;

  if (!payload || typeof payload.errors !== "object" || payload.errors === null) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(payload.errors).map(([field, messages]) => [
      field,
      Array.isArray(messages) ? messages.map(String) : [String(messages)],
    ]),
  );
}

async function mutate<T>(
  token: string,
  url: string,
  method: string,
  payload?: unknown,
) {
  return request<T>(url, token, {
    method,
    headers: { "Content-Type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
}

async function request<T>(url: string, token: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
    cache: "no-store",
  });
  const text = await response.text();
  let payload: unknown = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    const message =
      typeof (payload as ApiErrorPayload | null)?.message === "string"
        ? ((payload as ApiErrorPayload).message as string)
        : `Admin customer request failed with status ${response.status}.`;

    throw new AdminCustomersApiError(response.status, message, payload);
  }

  return payload as T;
}
