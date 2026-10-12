import type {
  AuthValidationErrors,
  AuthLogoutResponse,
  AuthMeResponse,
  AuthTokenResponse,
  AuthUserRole,
  GoogleAuthResponse,
  GoogleLinkProfile,
  GoogleSetupProfile,
} from "./authTypes";

const GOOGLE_AUTH_ERROR_MESSAGES: Record<string, string> = {
  google_cancelled: "Google sign-in was cancelled.",
  google_auth_failed:
    "Unable to sign in with Google right now. Please try again.",
  google_auth_unavailable:
    "Google sign-in is temporarily unavailable. Please try again.",
  google_state_invalid:
    "Your Google sign-in session is no longer valid. Please try again.",
  google_setup_expired:
    "Your Google sign-up session has expired. Please start again.",
  google_link_expired:
    "Your Google account-link session has expired. Please start again.",
  google_handoff_invalid:
    "Unable to complete Google sign-in. Please start again.",
  google_customer_only:
    "Google sign-in is available only for customer accounts. Please use the appropriate Admin or Staff sign-in.",
  google_account_inactive:
    "This customer account is not active. Please contact ALD support.",
  google_email_unverified: "A verified Google email is required to continue.",
  google_identity_conflict:
    "This Google account could not be connected to the requested ALD account. Please sign in normally or contact ALD support.",
  google_link_invalid: "The password is incorrect.",
};

const GOOGLE_RETURN_PATHS = new Set([
  "/",
  "/checkout",
  "/account/orders",
]);

type AuthRequestOptions = RequestInit & {
  token?: string;
};

type AuthErrorPayload = {
  code?: unknown;
  message?: unknown;
  errors?: unknown;
};

export class AuthApiError extends Error {
  readonly status: number;
  readonly errors: AuthValidationErrors;
  readonly code: string | null;

  constructor(
    status: number,
    message: string,
    errors: AuthValidationErrors = {},
    code: string | null = null,
  ) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
    this.errors = errors;
    this.code = code;
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
      typeof payload.code === "string" ? payload.code : null,
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

export function getSafeGoogleReturnTo(
  value: string | null | undefined,
): string {
  return value && GOOGLE_RETURN_PATHS.has(value) ? value : "/";
}

export function getGoogleAuthErrorMessage(
  error: unknown,
  fallback = "Unable to complete Google authentication. Please try again.",
): string {
  if (error instanceof AuthApiError) {
    const validationMessage = Object.values(error.errors)[0]?.[0];

    if (validationMessage) {
      return validationMessage;
    }

    if (error.code && GOOGLE_AUTH_ERROR_MESSAGES[error.code]) {
      return GOOGLE_AUTH_ERROR_MESSAGES[error.code];
    }

    if (error.status === 0 || error.status >= 500) {
      return "The authentication service is unavailable. Please try again.";
    }
  }

  return fallback;
}

export function getGoogleAuthErrorMessageForCode(
  code: string | null,
): string {
  return (
    (code && GOOGLE_AUTH_ERROR_MESSAGES[code]) ||
    "Unable to complete Google authentication. Please try again."
  );
}

export function getGoogleSetupProfile(token: string) {
  return authRequest<GoogleSetupProfile>(
    `/api/auth/google/setup?token=${encodeURIComponent(token)}`,
  );
}

export function completeGoogleRegistration(input: {
  setup_token: string;
  full_name: string;
  phone: string;
  password: string;
  password_confirmation: string;
}) {
  return authRequest<GoogleAuthResponse>(
    "/api/auth/google/complete",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function getGoogleLinkProfile(token: string) {
  return authRequest<GoogleLinkProfile>(
    `/api/auth/google/link?token=${encodeURIComponent(token)}`,
  );
}

export function linkGoogleAccount(input: {
  link_token: string;
  password: string;
}) {
  return authRequest<GoogleAuthResponse>(
    "/api/auth/google/link",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function exchangeGoogleAuthCode(code: string) {
  return authRequest<GoogleAuthResponse>(
    "/api/auth/google/exchange",
    {
      method: "POST",
      body: JSON.stringify({ code }),
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
