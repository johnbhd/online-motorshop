import type {
  StaffCustomerDetails,
  StaffCustomersResponse,
} from "./staffCustomersTypes";

type StaffCustomersQuery = {
  search?: string;
  type?: string;
  page: number;
  perPage: number;
  signal?: AbortSignal;
};

type ApiErrorPayload = {
  message?: unknown;
};

export class StaffCustomersApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "StaffCustomersApiError";
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

async function requestStaffCustomersApi<T>(
  path: string,
  token: string,
  signal?: AbortSignal,
): Promise<T> {
  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  });
  let response: Response;

  try {
    response = await fetch(path, {
      method: "GET",
      headers,
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    throw new StaffCustomersApiError(
      502,
      "The Staff customer service could not be reached.",
      error,
    );
  }

  const payload = await readPayload(response);

  if (!response.ok) {
    const errorPayload = isApiErrorPayload(payload) ? payload : {};
    const message =
      typeof errorPayload.message === "string"
        ? errorPayload.message
        : `Staff customer request failed with status ${response.status}.`;

    throw new StaffCustomersApiError(response.status, message, payload);
  }

  return payload as T;
}

export function getStaffCustomers(
  token: string,
  options: StaffCustomersQuery,
): Promise<StaffCustomersResponse> {
  const query = new URLSearchParams();

  if (options.search?.trim()) {
    query.set("search", options.search.trim());
  }

  if (options.type) {
    query.set("type", options.type);
  }

  query.set("page", String(options.page));
  query.set("per_page", String(options.perPage));

  return requestStaffCustomersApi<StaffCustomersResponse>(
    `/api/staff/customers?${query.toString()}`,
    token,
    options.signal,
  );
}

export function getStaffCustomer(
  token: string,
  customerId: number,
  signal?: AbortSignal,
): Promise<StaffCustomerDetails> {
  return requestStaffCustomersApi<StaffCustomerDetails>(
    `/api/staff/customers/${customerId}`,
    token,
    signal,
  );
}

export function getStaffCustomersErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof StaffCustomersApiError) {
    if (error.status === 401) {
      return "Your Staff session has expired. Please sign in again.";
    }

    if (error.status === 403) {
      return "You are not authorized to view Staff customers.";
    }

    if (error.status >= 500 || error.status === 0) {
      return "The Staff customer service is unavailable. Please try again.";
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
