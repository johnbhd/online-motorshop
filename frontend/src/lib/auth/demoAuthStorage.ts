import type {
  DemoAuthSession,
  DemoCustomerAccount,
  DemoUserRole,
} from "./demoAuthTypes";

export const REGISTERED_USERS_STORAGE_KEY = "ald_registered_users";
export const AUTH_SESSION_STORAGE_KEY = "ald_auth_session";

function isBrowser() {
  return typeof window !== "undefined";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readStoredJson(key: string): unknown {
  if (!isBrowser()) {
    return null;
  }

  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function isCustomerAccount(value: unknown): value is DemoCustomerAccount {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.email === "string" &&
    typeof value.phone === "string" &&
    typeof value.password === "string" &&
    value.role === "customer" &&
    typeof value.createdAt === "string"
  );
}

function isDemoRole(value: unknown): value is DemoUserRole {
  return value === "customer" || value === "staff" || value === "admin";
}

function isAuthSession(value: unknown): value is DemoAuthSession {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.email === "string" &&
    (!("phone" in value) || typeof value.phone === "string") &&
    isDemoRole(value.role) &&
    typeof value.createdAt === "string"
  );
}

export function getRegisteredCustomers(): DemoCustomerAccount[] {
  const parsed = readStoredJson(REGISTERED_USERS_STORAGE_KEY);
  return Array.isArray(parsed) ? parsed.filter(isCustomerAccount) : [];
}

export function getCustomerPhoneForSession(session: DemoAuthSession): string {
  if (session.role !== "customer") {
    return "";
  }

  if (session.phone?.trim()) {
    return session.phone;
  }

  const customer = getRegisteredCustomers().find(
    (account) => account.id === session.id || account.email === session.email,
  );

  return customer?.phone ?? "";
}

export function saveRegisteredCustomers(accounts: DemoCustomerAccount[]) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(
      REGISTERED_USERS_STORAGE_KEY,
      JSON.stringify(accounts),
    );
  } catch {
    // Ignore unavailable or quota-exceeded browser storage in the demo.
  }
}

export function getDemoSession(): DemoAuthSession | null {
  const parsed = readStoredJson(AUTH_SESSION_STORAGE_KEY);
  return isAuthSession(parsed) ? parsed : null;
}

export function saveDemoSession(session: DemoAuthSession) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore unavailable or quota-exceeded browser storage in the demo.
  }
}

export function clearDemoSession() {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  } catch {
    // Ignore unavailable browser storage in the demo.
  }
}
