import type {
  CustomerProfileResponse,
  CustomerProfileValidationErrors,
} from "./customerProfileTypes";

type ApiErrorPayload = {
  message?: unknown;
  errors?: unknown;
};

export class CustomerProfileApiError extends Error {
  readonly status: number;
  readonly errors: CustomerProfileValidationErrors;

  constructor(
    status: number,
    message: string,
    errors: CustomerProfileValidationErrors = {},
  ) {
    super(message);
    this.name = "CustomerProfileApiError";
    this.status = status;
    this.errors = errors;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseValidationErrors(value: unknown): CustomerProfileValidationErrors {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      ([, messages]) =>
        Array.isArray(messages) &&
        messages.every((message) => typeof message === "string"),
    ),
  ) as CustomerProfileValidationErrors;
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

async function requestCustomerProfileApi<T>(
  token: string,
  path: string,
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
    response = await fetch(`/api/customer/profile${path}`, {
      ...options,
      headers,
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    throw new CustomerProfileApiError(
      502,
      "The customer profile service could not be reached.",
    );
  }

  const payload = await readPayload(response);

  if (!response.ok) {
    const errorPayload: ApiErrorPayload = isRecord(payload) ? payload : {};
    const message =
      typeof errorPayload.message === "string"
        ? errorPayload.message
        : `Customer profile request failed with status ${response.status}.`;

    throw new CustomerProfileApiError(
      response.status,
      message,
      parseValidationErrors(errorPayload.errors),
    );
  }

  return payload as T;
}

export function getCustomerProfile(
  token: string,
  signal?: AbortSignal,
): Promise<CustomerProfileResponse> {
  return requestCustomerProfileApi<CustomerProfileResponse>(token, "", {
    method: "GET",
    signal,
  });
}

export function updateCustomerProfile(
  token: string,
  input: {
    name: string;
    email: string;
    contact_number: string;
    address: string;
  },
): Promise<CustomerProfileResponse> {
  return requestCustomerProfileApi<CustomerProfileResponse>(token, "", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function updateCustomerPassword(
  token: string,
  input: {
    current_password: string;
    password: string;
    password_confirmation: string;
  },
): Promise<{ message: string }> {
  return requestCustomerProfileApi<{ message: string }>(
    token,
    "/password",
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function getCustomerProfileValidationErrors(
  error: unknown,
): CustomerProfileValidationErrors {
  return error instanceof CustomerProfileApiError ? error.errors : {};
}

export function getCustomerProfileErrorMessage(
  error: unknown,
  fallback = "Unable to update your profile. Please try again.",
): string {
  if (error instanceof CustomerProfileApiError) {
    if (error.status === 401) {
      return "Your customer session has expired. Please sign in again.";
    }

    if (error.status === 403) {
      return "You are not authorized to update this profile.";
    }

    if (error.status >= 500 || error.status === 0) {
      return "The customer profile service is unavailable. Please try again.";
    }

    if (error.message) {
      return error.message;
    }
  }

  return fallback;
}
