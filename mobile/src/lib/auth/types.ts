export type AuthCustomer = {
  id: number;
  full_name: string;
  contact_number: string | null;
  email: string | null;
  address?: string | null;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
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

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterCredentials = {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
};
