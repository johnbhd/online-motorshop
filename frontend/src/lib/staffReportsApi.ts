import type { StaffReportsResponse } from "./staffReportsTypes";

type Query = {
  from?: string;
  to?: string;
  fulfillment?: string;
  orderStatus?: string;
  paymentStatus?: string;
  page?: number;
  perPage?: number;
  signal?: AbortSignal;
};

type ApiErrorPayload = {
  message?: unknown;
};

export class StaffReportsApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "StaffReportsApiError";
    this.status = status;
    this.payload = payload;
  }
}

export function getStaffReports(
  token: string,
  query: Query = {},
): Promise<StaffReportsResponse> {
  const params = new URLSearchParams();

  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.fulfillment) params.set("fulfillment", query.fulfillment);
  if (query.orderStatus) params.set("order_status", query.orderStatus);
  if (query.paymentStatus) params.set("payment_status", query.paymentStatus);
  if (query.page) params.set("page", String(query.page));
  if (query.perPage) params.set("per_page", String(query.perPage));

  return request<StaffReportsResponse>(
    `/api/staff/reports${params.size ? `?${params}` : ""}`,
    token,
    { signal: query.signal },
  );
}

export function getStaffReportsErrorMessage(error: unknown): string {
  if (error instanceof StaffReportsApiError) {
    if (error.status === 401) {
      return "Your Staff session has expired. Please sign in again.";
    }

    if (error.status === 403) {
      return "You are not authorized to view Staff reports.";
    }

    if (error.status >= 500) {
      return "The Staff Reports service is unavailable. Please try again.";
    }

    return error.message;
  }

  return error instanceof Error && error.message
    ? error.message
    : "Unable to load Staff reports.";
}

async function request<T>(
  url: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
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
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    throw new StaffReportsApiError(
      502,
      "The Staff Reports service could not be reached.",
      error,
    );
  }

  const text = await response.text();
  let payload: unknown = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    const errorPayload = isApiErrorPayload(payload) ? payload : {};
    const message =
      typeof errorPayload.message === "string"
        ? errorPayload.message
        : `Staff Reports request failed with status ${response.status}.`;

    throw new StaffReportsApiError(response.status, message, payload);
  }

  return payload as T;
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === "object" && value !== null;
}
