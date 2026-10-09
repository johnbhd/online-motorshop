import type { AuthUser, AuthValidationErrors } from "./auth/authTypes";

export type CustomerProfileResponse = {
  message?: string;
  user: AuthUser;
};

export type CustomerProfileValidationErrors = AuthValidationErrors;
