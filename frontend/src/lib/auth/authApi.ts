import type {
  AuthLogoutResponse,
  AuthMeResponse,
  AuthTokenResponse,
  AuthUserRole,
  AuthValidationErrors,
} from "./authTypes";

type AuthRequestOptions = RequestInit & {
  token?: string;
};

type AuthErrorPayload = {
  message?: unknown;
  errors?: unknown;
};

export class AuthApiError extends Error {
  readonly status: number;
  readonly errors: AuthValidationErrors;

  constructor(
    status: number,
    message: string,
    errors: AuthValidationErrors = {},
  ) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
    this.errors = errors;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function getValidationErrors(value: unknown): AuthValidationErrors {
  if (!isRecord(value)) {
    return {};
  }

  const errors: AuthValidationErrors = {};

  for (const [field, messages] of Object.entries(value)) {
    if (isStringArray(messages)) {
      errors[field] = messages;
    }
  }

  return errors;
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

async function authRequest<T>(
  path: string,
  options: AuthRequestOptions = {},
): Promise<T> {
  const { token, headers, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);

  requestHeaders.set("Accept", "application/json");

  if (requestOptions.body) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(path, {
      ...requestOptions,
      headers: requestHeaders,
      cache: "no-store",
    });
  } catch {
    throw new AuthApiError(
      0,
      "Unable to reach the authentication service.",
    );
  }

  const body = await readResponseBody(response);

  if (!response.ok) {
    const payload: AuthErrorPayload = isRecord(body) ? body : {};
    const message =
      typeof payload.message === "string"
        ? payload.message
        : "Authentication request failed.";

    throw new AuthApiError(
      response.status,
      message,
      getValidationErrors(payload.errors),
    );
  }

  return body as T;
}

export function login(input: { email: string; password: string }) {
  return authRequest<AuthTokenResponse>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function register(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
}) {
  return authRequest<AuthTokenResponse>(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function getCurrentUser(token: string) {
  return authRequest<AuthMeResponse>(
    "/api/auth/me",
    {
      method: "GET",
      token,
    },
  );
}

export function logout(token: string) {
  return authRequest<AuthLogoutResponse>(
    "/api/auth/logout",
    {
      method: "POST",
      token,
    },
  );
}

export function getAuthErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof AuthApiError) {
    const validationMessage = Object.values(error.errors)[0]?.[0];

    if (validationMessage) {
      return validationMessage;
    }

    if (error.status === 0 || error.status >= 500) {
      return "The authentication service is unavailable. Please try again.";
    }

    if (error.message) {
      return error.message;
    }
  }

  return fallback;
}

export function getRedirectPathForRole(role: AuthUserRole) {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "staff") {
    return "/staff";
  }

  return "/";
}
