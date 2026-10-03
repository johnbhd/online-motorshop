import type {
  AdminBranchMutationResponse,
  AdminBranchPayload,
  AdminBranchResponse,
  AdminBranchesResponse,
} from "./adminBranchTypes";

export class AdminBranchesApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "AdminBranchesApiError";
    this.status = status;
    this.payload = payload;
  }
}

type BranchQuery = {
  search?: string;
  status?: string;
  page?: number;
  perPage?: number;
  signal?: AbortSignal;
};

type ApiErrorPayload = {
  message?: unknown;
  errors?: unknown;
};

export function getAdminBranches(
  token: string,
  query: BranchQuery = {},
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries({
    search: query.search,
    status: query.status,
    page: query.page,
    per_page: query.perPage,
  })) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  return request<AdminBranchesResponse>(
    `/api/admin/branches${params.size ? `?${params}` : ""}`,
    token,
    { signal: query.signal },
  );
}

export function getAdminBranch(token: string, id: number) {
  return request<AdminBranchResponse>(`/api/admin/branches/${id}`, token);
}

export function createAdminBranch(
  token: string,
  payload: AdminBranchPayload,
) {
  return mutate<AdminBranchMutationResponse>(
    token,
    "/api/admin/branches",
    "POST",
    payload,
  );
}

export function updateAdminBranch(
  token: string,
  id: number,
  payload: Partial<AdminBranchPayload>,
) {
  return mutate<AdminBranchMutationResponse>(
    token,
    `/api/admin/branches/${id}`,
    "PATCH",
    payload,
  );
}

export function deleteAdminBranch(token: string, id: number) {
  return mutate<{ message: string }>(
    token,
    `/api/admin/branches/${id}`,
    "DELETE",
  );
}

export function getAdminBranchErrorMessage(error: unknown): string {
  if (error instanceof AdminBranchesApiError) {
    if (error.status === 401) {
      return "Your Admin session has expired. Please sign in again.";
    }

    if (error.status === 403) {
      return "You are not authorized to manage branches.";
    }

    if (error.status === 409) {
      return error.message;
    }

    if (error.status >= 500) {
      return "The Admin Branches service is unavailable. Please try again.";
    }

    return error.message;
  }

  return error instanceof Error && error.message
    ? error.message
    : "Unable to complete the branch request.";
}

export function getBranchValidationErrors(
  error: unknown,
): Record<string, string[]> {
  if (!(error instanceof AdminBranchesApiError)) {
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
        : `Admin branch request failed with status ${response.status}.`;

    throw new AdminBranchesApiError(response.status, message, payload);
  }

  return payload as T;
}
