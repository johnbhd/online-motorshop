import type {
  StaffPaymentDetailsResponse,
  StaffPaymentsResponse,
  StaffPaymentStatusResponse,
} from "./staffPaymentsTypes";

type StaffPaymentsQuery = {
  search?: string;
  status?: string;
  method?: string;
  page: number;
  perPage: number;
  signal?: AbortSignal;
};

type ApiErrorPayload = {
  message?: unknown;
};

export class StaffPaymentsApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "StaffPaymentsApiError";
    this.status = status;
    this.payload = payload;
  }
}

async function readPayload(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function requestStaffPaymentApi<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${token}`);

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(path, {
      ...options,
      headers,
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    throw new StaffPaymentsApiError(
      502,
      "The Staff payment service could not be reached.",
      error,
    );
  }

  const payload = await readPayload(response);

  if (!response.ok) {
    const errorPayload = isApiErrorPayload(payload) ? payload : {};
    const message =
      typeof errorPayload.message === "string"
        ? errorPayload.message
        : `Staff payment request failed with status ${response.status}.`;

    throw new StaffPaymentsApiError(response.status, message, payload);
  }

  return payload as T;
}

export function getStaffPayments(
  token: string,
  options: StaffPaymentsQuery,
): Promise<StaffPaymentsResponse> {
  const query = new URLSearchParams();

  if (options.search?.trim()) {
    query.set("search", options.search.trim());
  }

  if (options.status) {
    query.set("status", options.status);
  }

  if (options.method?.trim()) {
    query.set("method", options.method.trim());
  }

  query.set("page", String(options.page));
  query.set("per_page", String(options.perPage));

  return requestStaffPaymentApi<StaffPaymentsResponse>(
    `/api/staff/payments?${query.toString()}`,
    token,
    {
      method: "GET",
      signal: options.signal,
    },
  );
}

export function getStaffPayment(
  token: string,
  paymentId: number,
  signal?: AbortSignal,
): Promise<StaffPaymentDetailsResponse> {
  return requestStaffPaymentApi<StaffPaymentDetailsResponse>(
    `/api/staff/payments/${paymentId}`,
    token,
    {
      method: "GET",
      signal,
    },
  );
}

export function updateStaffPaymentStatus(
  token: string,
  paymentId: number,
  status: string,
  signal?: AbortSignal,
): Promise<StaffPaymentStatusResponse> {
  return requestStaffPaymentApi<StaffPaymentStatusResponse>(
    `/api/staff/payments/${paymentId}/status`,
    token,
    {
      method: "PATCH",
      signal,
      body: JSON.stringify({ status }),
    },
  );
}

export function getStaffPaymentsErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof StaffPaymentsApiError) {
    if (error.status === 401) {
      return "Your Staff session has expired. Please sign in again.";
    }

    if (error.status === 403) {
      return "You are not authorized to view Staff payments.";
    }

    if (error.status >= 500 || error.status === 0) {
      return "The Staff payment service is unavailable. Please try again.";
    }

    if (error.message) {
      return error.message;
    }
  }

  return fallback;
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === "object" && value !== null;
}
