import type {
  StaffOrderDetailsResponse,
  StaffOrderStatusResponse,
  StaffOrdersResponse,
} from "./staffOrdersTypes";

type StaffOrdersQuery = {
  search?: string;
  status?: string;
  fulfillment?: string;
  page: number;
  perPage: number;
  signal?: AbortSignal;
};

type ApiErrorPayload = {
  message?: unknown;
};

export class StaffOrdersApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "StaffOrdersApiError";
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

async function requestStaffApi<T>(
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

    throw new StaffOrdersApiError(
      502,
      "The Staff order service could not be reached.",
      error,
    );
  }

  const payload = await readPayload(response);

  if (!response.ok) {
    const errorPayload = isApiErrorPayload(payload) ? payload : {};
    const message =
      typeof errorPayload.message === "string"
        ? errorPayload.message
        : `Staff order request failed with status ${response.status}.`;

    throw new StaffOrdersApiError(response.status, message, payload);
  }

  return payload as T;
}

export function getStaffOrders(
  token: string,
  options: StaffOrdersQuery,
): Promise<StaffOrdersResponse> {
  const query = new URLSearchParams();

  if (options.search?.trim()) {
    query.set("search", options.search.trim());
  }

  if (options.status) {
    query.set("status", options.status);
  }

  if (options.fulfillment) {
    query.set("fulfillment", options.fulfillment);
  }

  query.set("page", String(options.page));
  query.set("per_page", String(options.perPage));

  return requestStaffApi<StaffOrdersResponse>(
    `/api/staff/orders?${query.toString()}`,
    token,
    {
      method: "GET",
      signal: options.signal,
    },
  );
}

export function getStaffOrder(
  token: string,
  reference: string,
  signal?: AbortSignal,
): Promise<StaffOrderDetailsResponse> {
  return requestStaffApi<StaffOrderDetailsResponse>(
    `/api/staff/orders/${encodeURIComponent(reference)}`,
    token,
    {
      method: "GET",
      signal,
    },
  );
}

export function updateStaffOrderStatus(
  token: string,
  reference: string,
  status: string,
  signal?: AbortSignal,
): Promise<StaffOrderStatusResponse> {
  return requestStaffApi<StaffOrderStatusResponse>(
    `/api/staff/orders/${encodeURIComponent(reference)}/status`,
    token,
    {
      method: "PATCH",
      signal,
      body: JSON.stringify({ status }),
    },
  );
}

export function getStaffOrdersErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof StaffOrdersApiError) {
    if (error.status === 401) {
      return "Your Staff session has expired. Please sign in again.";
    }

    if (error.status === 403) {
      return "You are not authorized to view Staff orders.";
    }

    if (error.status >= 500 || error.status === 0) {
      return "The Staff order service is unavailable. Please try again.";
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
