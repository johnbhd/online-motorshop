import type { AdminPaymentSettingsResponse } from "./adminSettingsTypes";

type ApiErrorPayload = {
  message?: unknown;
  errors?: unknown;
};

export class AdminSettingsApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.name = "AdminSettingsApiError";
    this.status = status;
    this.payload = payload;
  }
}

export function getAdminPaymentSettings(token: string, signal?: AbortSignal) {
  return request<AdminPaymentSettingsResponse>("/api/admin/settings", token, {
    signal,
  });
}

export function saveAdminPaymentSettings(token: string, body: FormData) {
  return request<AdminPaymentSettingsResponse>("/api/admin/settings", token, {
    method: "POST",
    body,
  });
}

export function getAdminSettingsErrorMessage(error: unknown): string {
  if (error instanceof AdminSettingsApiError) {
    if (error.status === 401) {
      return "Your Admin session has expired. Please sign in again.";
    }

    if (error.status === 403) {
      return "You are not authorized to manage payment settings.";
    }

    if (error.status >= 500) {
      return "The Admin Settings service is unavailable. Please try again.";
    }

    return error.message;
  }

  return error instanceof Error && error.message
    ? error.message
    : "Unable to load or save payment settings.";
}

export function getAdminSettingsValidationErrors(
  error: unknown,
): Record<string, string[]> {
  if (!(error instanceof AdminSettingsApiError)) {
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
        : `Admin settings request failed with status ${response.status}.`;

    throw new AdminSettingsApiError(response.status, message, payload);
  }

  return payload as T;
}
