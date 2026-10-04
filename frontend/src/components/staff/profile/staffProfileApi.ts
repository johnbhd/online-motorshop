import type {
  StaffProfileResponse,
  StaffProfileValidationErrors,
} from "./staffProfileTypes";

type ApiErrorPayload = {
  message?: unknown;
  errors?: unknown;
};

export class StaffProfileApiError extends Error {
  readonly status: number;
  readonly errors: StaffProfileValidationErrors;

  constructor(
    status: number,
    message: string,
    errors: StaffProfileValidationErrors = {},
  ) {
    super(message);
    this.name = "StaffProfileApiError";
    this.status = status;
    this.errors = errors;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseValidationErrors(value: unknown): StaffProfileValidationErrors {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      ([, messages]) =>
        Array.isArray(messages) &&
        messages.every((message) => typeof message === "string"),
    ),
  ) as StaffProfileValidationErrors;
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

async function requestStaffProfileApi<T>(
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
    response = await fetch("/api/staff/profile", {
      ...options,
      headers,
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    throw new StaffProfileApiError(
      502,
      "The Staff profile service could not be reached.",
    );
  }

  const payload = await readPayload(response);

  if (!response.ok) {
    const errorPayload: ApiErrorPayload = isRecord(payload) ? payload : {};
    const message =
      typeof errorPayload.message === "string"
        ? errorPayload.message
        : `Staff profile request failed with status ${response.status}.`;

    throw new StaffProfileApiError(
      response.status,
      message,
      parseValidationErrors(errorPayload.errors),
    );
  }

  return payload as T;
}

export function getStaffProfile(
  token: string,
  signal?: AbortSignal,
): Promise<StaffProfileResponse> {
  return requestStaffProfileApi<StaffProfileResponse>(token, {
    method: "GET",
    signal,
  });
}

export function updateStaffProfile(
  token: string,
  input: { name: string; email: string },
): Promise<StaffProfileResponse> {
  return requestStaffProfileApi<StaffProfileResponse>(token, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function getStaffProfileErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof StaffProfileApiError) {
    if (error.status === 401) {
      return "Your Staff session has expired. Please sign in again.";
    }

    if (error.status === 403) {
      return "You are not authorized to view or update this profile.";
    }

    if (error.status >= 500 || error.status === 0) {
      return "The Staff profile service is unavailable. Please try again.";
    }

    if (error.message) {
      return error.message;
    }
  }

  return fallback;
}
