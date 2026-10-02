import type { StaffDashboardResponse } from "./staffDashboardTypes";

type ApiErrorPayload = {
  message?: unknown;
};

export class StaffDashboardApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "StaffDashboardApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function getStaffDashboard(
  token: string,
  signal?: AbortSignal,
): Promise<StaffDashboardResponse> {
  const response = await fetch("/api/staff/dashboard", {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
    signal,
  });
  const payload = await readPayload(response);

  if (!response.ok) {
    const errorPayload = isApiErrorPayload(payload) ? payload : {};
    const message =
      typeof errorPayload.message === "string"
        ? errorPayload.message
        : `Staff dashboard request failed with status ${response.status}.`;

    throw new StaffDashboardApiError(response.status, message, payload);
  }

  return payload as StaffDashboardResponse;
}

export function getStaffDashboardErrorMessage(error: unknown): string {
  if (error instanceof StaffDashboardApiError) {
    if (error.status === 401) {
      return "Your Staff session has expired. Please sign in again.";
    }

    if (error.status === 403) {
      return "You are not authorized to view the Staff dashboard.";
    }

    if (error.status >= 500 || error.status === 0) {
      return "The Staff dashboard service is unavailable. Please try again.";
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unable to load the Staff dashboard.";
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

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === "object" && value !== null;
}
