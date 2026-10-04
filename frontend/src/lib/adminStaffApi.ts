import type {
  AdminStaffListResponse,
  AdminStaffMutationResponse,
  AdminStaffPayload,
  AdminStaffResponse,
} from "./adminStaffTypes";

export class AdminStaffApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "AdminStaffApiError";
    this.status = status;
    this.payload = payload;
  }
}

type StaffQuery = {
  search?: string;
  branchId?: number | "";
  status?: string;
  page?: number;
  perPage?: number;
  signal?: AbortSignal;
};

type ApiErrorPayload = {
  message?: unknown;
  errors?: unknown;
};

export function getAdminStaff(token: string, query: StaffQuery = {}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries({
    search: query.search,
    branch_id: query.branchId,
    status: query.status,
    page: query.page,
    per_page: query.perPage,
  })) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  return request<AdminStaffListResponse>(
    `/api/admin/staff${params.size ? `?${params}` : ""}`,
    token,
    { signal: query.signal },
  );
}

export function getAdminStaffMember(token: string, id: number) {
  return request<AdminStaffResponse>(`/api/admin/staff/${id}`, token);
}

export function createAdminStaff(token: string, payload: AdminStaffPayload) {
  return mutate<AdminStaffMutationResponse>(
    token,
    "/api/admin/staff",
    "POST",
    payload,
  );
}

export function updateAdminStaff(
  token: string,
  id: number,
  payload: AdminStaffPayload,
) {
  return mutate<AdminStaffMutationResponse>(
    token,
    `/api/admin/staff/${id}`,
    "PATCH",
    payload,
  );
}

export function updateAdminStaffPassword(
  token: string,
  id: number,
  password: Pick<AdminStaffPayload, "password" | "password_confirmation">,
) {
  return mutate<AdminStaffMutationResponse>(
    token,
    `/api/admin/staff/${id}/password`,
    "PATCH",
    password,
  );
}

export function deleteAdminStaff(token: string, id: number) {
  return mutate<{ message: string }>(
    token,
    `/api/admin/staff/${id}`,
    "DELETE",
  );
}

export function getAdminStaffErrorMessage(error: unknown): string {
  if (error instanceof AdminStaffApiError) {
    if (error.status === 401) {
      return "Your Admin session has expired. Please sign in again.";
    }

    if (error.status === 403) {
      return "You are not authorized to manage staff accounts.";
    }

    if (error.status === 409) {
      return error.message;
    }

    if (error.status >= 500) {
      return "The Admin Staff service is unavailable. Please try again.";
    }

    return error.message;
  }

  return error instanceof Error && error.message
    ? error.message
    : "Unable to complete the staff request.";
}

export function getStaffValidationErrors(
  error: unknown,
): Record<string, string[]> {
  if (!(error instanceof AdminStaffApiError)) {
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
        : `Admin staff request failed with status ${response.status}.`;

    throw new AdminStaffApiError(response.status, message, payload);
  }

  return payload as T;
}
