export type AuthUserRole = "customer" | "staff" | "admin";

export type AuthCustomer = {
  id: number;
  full_name: string;
  contact_number: string;
  email: string;
  address: string | null;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: AuthUserRole;
  status: string;
  customer: AuthCustomer | null;
};

export type AuthTokenResponse = {
  message: string;
  token: string;
  token_type: string;
  user: AuthUser;
};

export type AuthMeResponse = {
  user: AuthUser;
};

export type AuthLogoutResponse = {
  message: string;
};

export type AuthValidationErrors = Record<string, string[]>;
