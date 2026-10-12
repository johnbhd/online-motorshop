export type AuthUserRole = "customer" | "staff" | "admin";

export type AuthCustomer = {
  id: number;
  full_name: string;
  contact_number: string;
  email: string;
  address: string | null;
  city?: string | null;
  barangay?: string | null;
  city_municipality_code?: string | null;
  barangay_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
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

export type GoogleAuthErrorCode =
  | "google_cancelled"
  | "google_auth_failed"
  | "google_auth_unavailable"
  | "google_state_invalid"
  | "google_setup_expired"
  | "google_link_expired"
  | "google_handoff_invalid"
  | "google_customer_only"
  | "google_account_inactive"
  | "google_email_unverified"
  | "google_identity_conflict"
  | "google_link_invalid";

export type GoogleAuthResponse = AuthTokenResponse & {
  return_to?: string;
};

export type GoogleSetupProfile = {
  name: string;
  email: string;
  expiresAt: string;
  return_to: string;
};

export type GoogleLinkProfile = {
  email: string;
  expiresAt: string;
  return_to: string;
};
