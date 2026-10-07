import type {
  AdminPasswordPayload,
  AdminProfilePayload,
  AdminProfileResponse,
} from "./adminProfileTypes";

type ApiErrorPayload = {
  message?: unknown;
  errors?: unknown;
};

export class AdminProfileApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.name = "AdminProfileApiError";
    this.status = status;
    this.payload = payload;
  }
}

export function getAdminProfile(token: string, signal?: AbortSignal) {
  return request<AdminProfileResponse>("/api/admin/profile", token, {
    signal,
  });
}

export function updateAdminProfile(
  token: string,
  payload: AdminProfilePayload,
) {
  return mutate<AdminProfileResponse>(
    token,
    "/api/admin/profile",
    payload,
  );
}

export function updateAdminPassword(
  token: string,
  payload: AdminPasswordPayload,
) {
  return mutate<{ message: string }>(
    token,
    "/api/admin/profile/password",
    payload,
  );
}

export function getAdminProfileErrorMessage(error: unknown): string {
  if (error instanceof AdminProfileApiError) {
    if (error.status === 401) {
      return "Your Admin session has expired. Please sign in again.";
    }

    if (error.status === 403) {
      return "You are not authorized to manage this profile.";
    }

    if (error.status >= 500) {
      return "The Admin Profile service is unavailable. Please try again.";
    }

    return error.message;
  }

  return error instanceof Error && error.message
    ? error.message
    : "Unable to load or save your profile.";
}

export function getAdminProfileValidationErrors(
  error: unknown,
): Record<string, string[]> {
  if (!(error instanceof AdminProfileApiError)) {
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

async function mutate<T>(token: string, url: string, payload: unknown) {
  return request<T>(url, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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
    const errorPayload = payload as ApiErrorPayload | null;
    const message =
      typeof errorPayload?.message === "string"
        ? errorPayload.message
        : `Admin profile request failed with status ${response.status}.`;

    throw new AdminProfileApiError(response.status, message, payload);
  }

  return payload as T;
}
