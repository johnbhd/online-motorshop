import { apiRequest } from '@/lib/api/client';

import type {
  AuthLogoutResponse,
  AuthMeResponse,
  AuthTokenResponse,
  LoginCredentials,
  RegisterCredentials,
} from './types';

export function login(credentials: LoginCredentials) {
  return apiRequest<AuthTokenResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export function register(credentials: RegisterCredentials) {
  return apiRequest<AuthTokenResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export function getCurrentUser(token: string) {
  return apiRequest<AuthMeResponse>('/api/auth/me', {
    token,
  });
}

export function logout(token: string) {
  return apiRequest<AuthLogoutResponse>('/api/auth/logout', {
    method: 'POST',
    token,
  });
}
