import type {
  StaffProductDetailsResponse,
  StaffProductsResponse,
} from "./staffProductsTypes";

type StaffProductsQuery = {
  search?: string;
  brand?: string;
  category?: string;
  status?: string;
  availabilityStatus?: string;
  sort?: string;
  page: number;
  perPage: number;
  signal?: AbortSignal;
};

type ApiErrorPayload = {
  message?: unknown;
};

export class StaffProductsApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "StaffProductsApiError";
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

async function requestStaffProductsApi<T>(
  path: string,
  token: string,
  signal?: AbortSignal,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    throw new StaffProductsApiError(
      502,
      "The Staff product service could not be reached.",
      error,
    );
  }

  const payload = await readPayload(response);

  if (!response.ok) {
    const errorPayload = isApiErrorPayload(payload) ? payload : {};
    const message =
      typeof errorPayload.message === "string"
        ? errorPayload.message
        : `Staff product request failed with status ${response.status}.`;

    throw new StaffProductsApiError(response.status, message, payload);
  }

  return payload as T;
}

export function getStaffProducts(
  token: string,
  options: StaffProductsQuery,
): Promise<StaffProductsResponse> {
  const query = new URLSearchParams();

  if (options.search?.trim()) query.set("search", options.search.trim());
  if (options.brand) query.set("brand", options.brand);
  if (options.category) query.set("category", options.category);
  if (options.status) query.set("status", options.status);
  if (options.availabilityStatus) {
    query.set("availability_status", options.availabilityStatus);
  }
  if (options.sort) query.set("sort", options.sort);

  query.set("page", String(options.page));
  query.set("per_page", String(options.perPage));

  return requestStaffProductsApi<StaffProductsResponse>(
    `/api/staff/products?${query.toString()}`,
    token,
    options.signal,
  );
}

export function getStaffProduct(
  token: string,
  partNumber: string,
  signal?: AbortSignal,
): Promise<StaffProductDetailsResponse> {
  return requestStaffProductsApi<StaffProductDetailsResponse>(
    `/api/staff/products/${encodeURIComponent(partNumber)}`,
    token,
    signal,
  );
}

export function getStaffProductsErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof StaffProductsApiError) {
    if (error.status === 401) {
      return "Your Staff session has expired. Please sign in again.";
    }

    if (error.status === 403) {
      return "You are not authorized to view Staff products.";
    }

    if (error.status >= 500 || error.status === 0) {
      return "The Staff product service is unavailable. Please try again.";
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
