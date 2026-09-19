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
import { logoutDemoUser } from "@/lib/auth/demoAuth";
import {
  AUTH_SESSION_STORAGE_KEY,
  getDemoSession,
} from "@/lib/auth/demoAuthStorage";
import type { DemoAuthSession } from "@/lib/auth/demoAuthTypes";

type DemoAuthContextValue = {
  session: DemoAuthSession | null;
  isReady: boolean;
  setSession: (session: DemoAuthSession) => void;
  logout: () => void;
};

const DemoAuthContext = createContext<DemoAuthContextValue | null>(null);

export function DemoAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<DemoAuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initialize = () => {
      setSessionState(getDemoSession());
      setIsReady(true);
    };
    const timer = window.setTimeout(initialize, 0);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === AUTH_SESSION_STORAGE_KEY) {
        setSessionState(getDemoSession());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const setSession = useCallback((nextSession: DemoAuthSession) => {
    setSessionState(nextSession);
  }, []);

  const logout = useCallback(() => {
    logoutDemoUser();
    setSessionState(null);
  }, []);

  const value = useMemo(
    () => ({ session, isReady, setSession, logout }),
    [isReady, logout, session, setSession],
  );

  return (
    <DemoAuthContext.Provider value={value}>
      {children}
    </DemoAuthContext.Provider>
  );
}

export function useDemoAuth() {
  const context = useContext(DemoAuthContext);

  if (!context) {
    throw new Error("useDemoAuth must be used inside DemoAuthProvider");
  }

  return context;
}
