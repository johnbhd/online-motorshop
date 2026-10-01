"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getCurrentUser,
  logout as logoutFromApi,
} from "@/lib/auth/authApi";
import {
  clearAuthToken,
  clearLegacyAuthStorage,
  getAuthToken,
  setAuthToken,
} from "@/lib/auth/authStorage";
import type { AuthUser } from "@/lib/auth/authTypes";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  establishSession: (token: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function initializeAuthentication() {
      clearLegacyAuthStorage();

      const token = getAuthToken();

      if (!token) {
        if (!isCancelled) {
          setIsLoading(false);
        }

        return;
      }

      try {
        const response = await getCurrentUser(token);

        if (!isCancelled) {
          setUser(response.user);
        }
      } catch {
        clearAuthToken();

        if (!isCancelled) {
          setUser(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void initializeAuthentication();

    return () => {
      isCancelled = true;
    };
  }, []);

  const establishSession = useCallback(async (token: string) => {
    setAuthToken(token);

    try {
      const response = await getCurrentUser(token);

      setUser(response.user);
      setIsLoading(false);

      return response.user;
    } catch (error) {
      clearAuthToken();
      setUser(null);
      setIsLoading(false);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    const token = getAuthToken();

    try {
      if (token) {
        await logoutFromApi(token);
      }
    } catch {
      // The local token must still be cleared when the backend rejects it.
    } finally {
      clearAuthToken();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      establishSession,
      logout,
    }),
    [establishSession, isLoading, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
