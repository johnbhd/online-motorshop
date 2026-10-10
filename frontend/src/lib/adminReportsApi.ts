import type { AdminReportsResponse } from "./adminReportsTypes";

export class AdminReportsApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "AdminReportsApiError";
    this.status = status;
    this.payload = payload;
  }
}

type Query = {
  from?: string;
  to?: string;
  branchId?: number | "";
  signal?: AbortSignal;
};

export function getAdminReports(token: string, query: Query = {}) {
  const params = new URLSearchParams();
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.branchId !== undefined && query.branchId !== "") {
    params.set("branch_id", String(query.branchId));
  }

  return request<AdminReportsResponse>(
    `/api/admin/reports${params.size ? `?${params}` : ""}`,
    token,
    { signal: query.signal },
  );
}

export function getAdminReportsErrorMessage(error: unknown): string {
  if (error instanceof AdminReportsApiError) {
    if (error.status === 401) return "Your Admin session has expired. Please sign in again.";
    if (error.status === 403) return "You are not authorized to view reports.";
    if (error.status >= 500) return "The Admin Reports service is unavailable. Please try again.";
    return error.message;
  }

  return error instanceof Error && error.message
    ? error.message
    : "Unable to load Admin Reports.";
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
    throw new AdminReportsApiError(502, "The Admin Reports service could not be reached.", error);
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
      : `Admin Reports request failed with status ${response.status}.`;
    throw new AdminReportsApiError(response.status, message, payload);
  }

  return payload as T;
}
