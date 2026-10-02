export type StaffSidebarCounts = {
  orders: number;
  payments: number;
  pickup_requests: number;
  delivery_requests: number;
  messages: number;
};

type StaffSidebarResponse = {
  counts: StaffSidebarCounts;
};

type ApiErrorPayload = {
  message?: unknown;
};

export class StaffSidebarApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "StaffSidebarApiError";
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

export async function getStaffSidebarCounts(
  token: string,
  signal?: AbortSignal,
): Promise<StaffSidebarCounts> {
  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  });
  const response = await fetch("/api/staff/sidebar-summary", {
    method: "GET",
    headers,
    cache: "no-store",
    signal,
  });
  const payload = await readPayload(response);

  if (!response.ok) {
    const errorPayload = isApiErrorPayload(payload) ? payload : {};
    const message =
      typeof errorPayload.message === "string"
        ? errorPayload.message
        : `Staff sidebar request failed with status ${response.status}.`;

    throw new StaffSidebarApiError(response.status, message, payload);
  }

  return (payload as StaffSidebarResponse).counts;
}

export function notifyStaffDataUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("staff-data-updated"));
  }
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === "object" && value !== null;
}
