import type {
  StaffPickupDetailsResponse,
  StaffPickupsResponse,
  StaffPickupStatusResponse,
} from "./staffPickupTypes";

type StaffPickupsQuery = {
  search?: string;
  status?: string;
  page: number;
  perPage: number;
  signal?: AbortSignal;
};

type ApiErrorPayload = {
  message?: unknown;
};

export class StaffPickupsApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "StaffPickupsApiError";
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

async function requestStaffPickupApi<T>(
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

    throw new StaffPickupsApiError(
      502,
      "The Staff pickup service could not be reached.",
      error,
    );
  }

  const payload = await readPayload(response);

  if (!response.ok) {
    const errorPayload = isApiErrorPayload(payload) ? payload : {};
    const message =
      typeof errorPayload.message === "string"
        ? errorPayload.message
        : `Staff pickup request failed with status ${response.status}.`;

    throw new StaffPickupsApiError(response.status, message, payload);
  }

  return payload as T;
}

export function getStaffPickups(
  token: string,
  options: StaffPickupsQuery,
): Promise<StaffPickupsResponse> {
  const query = new URLSearchParams();

  if (options.search?.trim()) {
    query.set("search", options.search.trim());
  }

  if (options.status) {
    query.set("status", options.status);
  }

  query.set("page", String(options.page));
  query.set("per_page", String(options.perPage));

  return requestStaffPickupApi<StaffPickupsResponse>(
    `/api/staff/pickup-requests?${query.toString()}`,
    token,
    {
      method: "GET",
      signal: options.signal,
    },
  );
}

export function getStaffPickup(
  token: string,
  pickupId: number,
  signal?: AbortSignal,
): Promise<StaffPickupDetailsResponse> {
  return requestStaffPickupApi<StaffPickupDetailsResponse>(
    `/api/staff/pickup-requests/${pickupId}`,
    token,
    {
      method: "GET",
      signal,
    },
  );
}

export function updateStaffPickupStatus(
  token: string,
  pickupId: number,
  status: string,
  signal?: AbortSignal,
): Promise<StaffPickupStatusResponse> {
  return requestStaffPickupApi<StaffPickupStatusResponse>(
    `/api/staff/pickup-requests/${pickupId}/status`,
    token,
    {
      method: "PATCH",
      signal,
      body: JSON.stringify({ status }),
    },
  );
}

export function getStaffPickupsErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof StaffPickupsApiError) {
    if (error.status === 401) {
      return "Your Staff session has expired. Please sign in again.";
    }

    if (error.status === 403) {
      return "You are not authorized to view Staff pickup requests.";
    }

    if (error.status >= 500 || error.status === 0) {
      return "The Staff pickup service is unavailable. Please try again.";
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
