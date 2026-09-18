import { adminStaff } from "@/lib/mock/admin";
import {
  clearDemoSession,
  getRegisteredCustomers,
  saveDemoSession,
  saveRegisteredCustomers,
} from "./demoAuthStorage";
import type {
  DemoAuthSession,
  DemoLoginResult,
  DemoRegisterResult,
} from "./demoAuthTypes";

// TEMPORARY FRONTEND DEMO AUTH.
// Replace this credential check with Laravel Sanctum authentication during backend integration.
export const DEMO_ADMIN_EMAIL = "admin@gmail.com";
export const DEMO_ADMIN_PASSWORD = "admin123";
export const DEMO_STAFF_PASSWORD = "staff123";

export const DEMO_ADMIN_CREDENTIALS = {
  email: DEMO_ADMIN_EMAIL,
  password: DEMO_ADMIN_PASSWORD,
} as const;

const INVALID_LOGIN_MESSAGE = "Invalid email or password.";
const DUPLICATE_EMAIL_MESSAGE = "An account with this email already exists.";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createSession(
  id: string,
  name: string,
  email: string,
  role: DemoAuthSession["role"],
): DemoAuthSession {
  return {
    id,
    name,
    email,
    role,
    createdAt: new Date().toISOString(),
  };
}

function persistSession(session: DemoAuthSession): DemoLoginResult {
  saveDemoSession(session);
  return { success: true, session };
}

function findStaffByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  return adminStaff.find(
    (staff) => normalizeEmail(staff.email) === normalizedEmail,
  );
}

export function isReservedDemoEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  return (
    normalizedEmail === DEMO_ADMIN_EMAIL ||
    adminStaff.some((staff) => normalizeEmail(staff.email) === normalizedEmail)
  );
}

export function registerCustomer(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirmation: string;
}): DemoRegisterResult {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const phone = input.phone.trim();

  if (!name) {
    return { success: false, error: "Please enter your full name." };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  if (isReservedDemoEmail(email)) {
    return { success: false, error: DUPLICATE_EMAIL_MESSAGE };
  }

  if (!phone) {
    return { success: false, error: "Please enter your contact number." };
  }

  if (!input.password) {
    return { success: false, error: "Please enter a password." };
  }

  if (!input.passwordConfirmation) {
    return { success: false, error: "Please confirm your password." };
  }

  if (input.password !== input.passwordConfirmation) {
    return { success: false, error: "Passwords do not match." };
  }

  const registeredCustomers = getRegisteredCustomers();
  if (registeredCustomers.some((customer) => customer.email === email)) {
    return { success: false, error: DUPLICATE_EMAIL_MESSAGE };
  }

  saveRegisteredCustomers([
    ...registeredCustomers,
    {
      id: `customer-${Date.now()}`,
      name,
      email,
      phone,
      // TEMPORARY FRONTEND DEMO AUTH ONLY. Never store plaintext passwords in production.
      password: input.password,
      role: "customer",
      createdAt: new Date().toISOString(),
    },
  ]);

  return { success: true };
}

export function loginDemoUser(email: string, password: string): DemoLoginResult {
  const normalizedEmail = normalizeEmail(email);

  if (
    normalizedEmail === DEMO_ADMIN_EMAIL &&
    password === DEMO_ADMIN_PASSWORD
  ) {
    return persistSession(
      createSession("demo-admin", "Admin User", DEMO_ADMIN_EMAIL, "admin"),
    );
  }

  const staff = findStaffByEmail(normalizedEmail);
  if (staff) {
    if (staff.status.trim().toLowerCase() !== "active") {
      return { success: false, error: INVALID_LOGIN_MESSAGE };
    }

    if (password === DEMO_STAFF_PASSWORD) {
      return persistSession(
        createSession(
          `staff-${normalizedEmail}`,
          staff.name,
          normalizeEmail(staff.email),
          "staff",
        ),
      );
    }

    return { success: false, error: INVALID_LOGIN_MESSAGE };
  }

  const customer = getRegisteredCustomers().find(
    (account) => account.email === normalizedEmail && account.password === password,
  );

  if (!customer) {
    return { success: false, error: INVALID_LOGIN_MESSAGE };
  }

  return persistSession(
    createSession(customer.id, customer.name, customer.email, "customer"),
  );
}

export function getRedirectPathForRole(role: DemoAuthSession["role"]) {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "staff") {
    return "/staff";
  }

  return "/";
}

export function logoutDemoUser() {
  clearDemoSession();
}
