import type {
  StaffDeliveryDetailsResponse,
  StaffDeliveriesResponse,
  StaffDeliveryStatusResponse,
} from "./staffDeliveryTypes";
import { notifyStaffDataUpdated } from "@/components/staff/staffSidebarApi";

type StaffDeliveriesQuery = {
  search?: string;
  status?: string;
  page: number;
  perPage: number;
  signal?: AbortSignal;
};

type ApiErrorPayload = {
  message?: unknown;
};

export class StaffDeliveriesApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "StaffDeliveriesApiError";
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

async function requestStaffDeliveryApi<T>(
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

    throw new StaffDeliveriesApiError(
      502,
      "The Staff delivery service could not be reached.",
      error,
    );
  }

  const payload = await readPayload(response);

  if (!response.ok) {
    const errorPayload = isApiErrorPayload(payload) ? payload : {};
    const message =
      typeof errorPayload.message === "string"
        ? errorPayload.message
        : `Staff delivery request failed with status ${response.status}.`;

    throw new StaffDeliveriesApiError(response.status, message, payload);
  }

  return payload as T;
}

export function getStaffDeliveries(
  token: string,
  options: StaffDeliveriesQuery,
): Promise<StaffDeliveriesResponse> {
  const query = new URLSearchParams();

  if (options.search?.trim()) {
    query.set("search", options.search.trim());
  }

  if (options.status) {
    query.set("status", options.status);
  }

  query.set("page", String(options.page));
  query.set("per_page", String(options.perPage));

  return requestStaffDeliveryApi<StaffDeliveriesResponse>(
    `/api/staff/delivery-requests?${query.toString()}`,
    token,
    {
      method: "GET",
      signal: options.signal,
    },
  );
}

export function getStaffDelivery(
  token: string,
  deliveryId: number,
  signal?: AbortSignal,
): Promise<StaffDeliveryDetailsResponse> {
  return requestStaffDeliveryApi<StaffDeliveryDetailsResponse>(
    `/api/staff/delivery-requests/${deliveryId}`,
    token,
    {
      method: "GET",
      signal,
    },
  );
}

export type StaffDeliveryStatusUpdate = {
  status: string;
  booking_reference?: string;
  tracking_url?: string;
  rider_name?: string;
  rider_contact?: string;
  remarks?: string;
};

export async function updateStaffDeliveryStatus(
  token: string,
  deliveryId: number,
  update: StaffDeliveryStatusUpdate,
  signal?: AbortSignal,
): Promise<StaffDeliveryStatusResponse> {
  const response = await requestStaffDeliveryApi<StaffDeliveryStatusResponse>(
    `/api/staff/delivery-requests/${deliveryId}/status`,
    token,
    {
      method: "PATCH",
      signal,
      body: JSON.stringify(update),
    },
  );

  notifyStaffDataUpdated();

  return response;
}

export function getStaffDeliveriesErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof StaffDeliveriesApiError) {
    if (error.status === 401) {
      return "Your Staff session has expired. Please sign in again.";
    }

    if (error.status === 403) {
      return "You are not authorized to view Staff delivery requests.";
    }

    if (error.status >= 500 || error.status === 0) {
      return "The Staff delivery service is unavailable. Please try again.";
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
