import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { ApiError } from '@/lib/api/client';

import { getCurrentUser, login, logout, register } from '@/lib/auth/api';
import {
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from '@/lib/auth/storage';
import type {
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
} from '@/lib/auth/types';

type AuthContextValue = {
  user: AuthUser | null;
  isRestoring: boolean;
  error: string | null;
  signIn: (credentials: LoginCredentials) => Promise<AuthUser>;
  register: (credentials: RegisterCredentials) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  retrySessionRestore: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getAuthErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Your session has expired. Please sign in again.';
    }

    if (error.status === 422) {
      return 'Please check your account details and try again.';
    }

    if (error.kind === 'configuration') {
      return 'The mobile API is not configured yet.';
    }

    if (error.kind === 'timeout') {
      return 'The authentication request timed out. Please retry.';
    }

    if (error.kind === 'network') {
      return 'The authentication service is unavailable. Please retry.';
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'The authentication request failed. Please retry.';
}

function assertCustomer(user: AuthUser) {
  if (user.role !== 'customer') {
    throw new ApiError('This mobile app is for customer accounts.', {
      status: 403,
    });
  }

  return user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const restoreSession = useCallback(async () => {
    setIsRestoring(true);
    setError(null);

    const token = await getAuthToken();

    if (!token) {
      setUser(null);
      setIsRestoring(false);
      return;
    }

    try {
      const response = await getCurrentUser(token);

      setUser(assertCustomer(response.user));
    } catch (restoreError) {
      if (
        restoreError instanceof ApiError &&
        (restoreError.status === 401 || restoreError.status === 403)
      ) {
        await clearAuthToken();
        setUser(null);
      }

      setError(getAuthErrorMessage(restoreError));
    } finally {
      setIsRestoring(false);
    }
  }, []);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const establishSession = useCallback(async (token: string) => {
    await setAuthToken(token);
    const response = await getCurrentUser(token);
    const customer = assertCustomer(response.user);

    setUser(customer);
    setError(null);

    return customer;
  }, []);

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    try {
      const response = await login(credentials);

      return await establishSession(response.token);
    } catch (signInError) {
      await clearAuthToken();
      setUser(null);
      setError(getAuthErrorMessage(signInError));
      throw signInError;
    }
  }, [establishSession]);

  const registerCustomer = useCallback(
    async (credentials: RegisterCredentials) => {
      try {
        const response = await register(credentials);

        return await establishSession(response.token);
      } catch (registerError) {
        await clearAuthToken();
        setUser(null);
        setError(getAuthErrorMessage(registerError));
        throw registerError;
      }
    },
    [establishSession],
  );

  const signOut = useCallback(async () => {
    const token = await getAuthToken();

    try {
      if (token) {
        await logout(token);
      }
    } catch (logoutError) {
      setError(getAuthErrorMessage(logoutError));
    } finally {
      await clearAuthToken();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isRestoring,
      error,
      signIn,
      register: registerCustomer,
      signOut,
      retrySessionRestore: restoreSession,
    }),
    [error, isRestoring, registerCustomer, restoreSession, signIn, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
