import type {
  LaravelValidationErrors,
  OrderRequestPayload,
  OrderRequestSuccessResponse,
} from "./orderRequestTypes";

type OrderRequestErrorPayload = {
  message?: unknown;
  errors?: unknown;
};

export class OrderRequestApiError extends Error {
  readonly status: number;
  readonly errors: LaravelValidationErrors;

  constructor(
    status: number,
    message: string,
    errors: LaravelValidationErrors = {},
  ) {
    super(message);
    this.name = "OrderRequestApiError";
    this.status = status;
    this.errors = errors;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getValidationErrors(value: unknown): LaravelValidationErrors {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(([, messages]) => {
      return (
        Array.isArray(messages) &&
        messages.every((message) => typeof message === "string")
      );
    }),
  ) as LaravelValidationErrors;
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function submitOrderRequest(
  payload: OrderRequestPayload,
  token?: string | null,
): Promise<OrderRequestSuccessResponse> {
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
  });

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch("/api/order-requests", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    throw new OrderRequestApiError(
      0,
      "Unable to reach the order request service.",
    );
  }

  const body = await readResponseBody(response);

  if (!response.ok) {
    const errorPayload: OrderRequestErrorPayload = isRecord(body) ? body : {};
    const message =
      typeof errorPayload.message === "string"
        ? errorPayload.message
        : "The order request could not be submitted.";

    throw new OrderRequestApiError(
      response.status,
      message,
      getValidationErrors(errorPayload.errors),
    );
  }

  if (
    response.status !== 201 ||
    !isRecord(body) ||
    typeof body.message !== "string" ||
    !isRecord(body.order) ||
    typeof body.order.reference !== "string"
  ) {
    throw new OrderRequestApiError(
      502,
      "The order request service returned an invalid confirmation.",
    );
  }

  return body as unknown as OrderRequestSuccessResponse;
}

export function getOrderRequestErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof OrderRequestApiError) {
    const validationMessage = Object.values(error.errors)[0]?.[0];

    if (validationMessage) {
      return validationMessage;
    }

    if (error.status === 0 || error.status >= 500) {
      return "The order service is unavailable. Your cart is still saved. Please try again.";
    }

    if (error.status === 401) {
      return "Your customer session is no longer valid. Sign in again or continue as a guest before submitting this request.";
    }

    if (error.status === 403) {
      return "This account is not allowed to submit customer order requests.";
    }

    if (error.message) {
      return error.message;
    }
  }

  return fallback;
}
