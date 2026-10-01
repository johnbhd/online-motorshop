export const AUTH_TOKEN_STORAGE_KEY = "ald_auth_token";

const LEGACY_REGISTERED_USERS_STORAGE_KEY = "ald_registered_users";
const LEGACY_AUTH_SESSION_STORAGE_KEY = "ald_auth_session";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getAuthToken(): string | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

    return token?.trim() || null;
  } catch {
    return null;
  }
}

export function setAuthToken(token: string) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } catch {
    // Ignore unavailable or quota-exceeded browser storage.
  }
}

export function clearAuthToken() {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore unavailable browser storage.
  }
}

export function clearLegacyAuthStorage() {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.removeItem(LEGACY_REGISTERED_USERS_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_AUTH_SESSION_STORAGE_KEY);
  } catch {
    // Ignore unavailable browser storage.
  }
}
