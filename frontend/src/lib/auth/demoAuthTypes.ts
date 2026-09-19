export type DemoUserRole = "customer" | "staff" | "admin";

export type DemoAuthSession = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: DemoUserRole;
  createdAt: string;
};

// TEMPORARY FRONTEND DEMO AUTH.
// Passwords are stored only to simulate the presentation flow in localStorage.
// Replace this account shape with Laravel Sanctum-backed users during backend integration.
export type DemoCustomerAccount = {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "customer";
  createdAt: string;
};

export type DemoLoginResult =
  | { success: true; session: DemoAuthSession }
  | { success: false; error: string };

export type DemoRegisterResult =
  | { success: true }
  | { success: false; error: string };
