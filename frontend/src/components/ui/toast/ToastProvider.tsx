"use client";

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCircleInfo,
  faTriangleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastVariant = "success" | "error" | "info";

export type ToastOptions = {
  title: string;
  message: string;
  variant?: ToastVariant;
};

type Toast = ToastOptions & {
  id: number;
  variant: ToastVariant;
};

type ToastContextValue = {
  showToast: (options: ToastOptions) => void;
  dismissToast: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function getToastIcon(variant: ToastVariant): IconDefinition {
  if (variant === "error") {
    return faTriangleExclamation;
  }

  if (variant === "info") {
    return faCircleInfo;
  }

  return faCheck;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const dismissToast = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setToast(null);
  }, []);

  const showToast = useCallback((options: ToastOptions) => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    const id = Date.now();
    const variant = options.variant ?? "success";

    setToast({ ...options, id, variant });
    timeoutRef.current = window.setTimeout(() => {
      setToast((currentToast) =>
        currentToast?.id === id ? null : currentToast,
      );
      timeoutRef.current = null;
    }, 4200);
  }, []);

  const contextValue = useMemo(
    () => ({ showToast, dismissToast }),
    [dismissToast, showToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toast ? (
        <div className="ald-toast-viewport">
          <div
            className={`ald-toast ald-toast--${toast.variant}`}
            role={toast.variant === "error" ? "alert" : "status"}
            aria-live={toast.variant === "error" ? "assertive" : "polite"}
            aria-atomic="true"
          >
            <span className="ald-toast__icon" aria-hidden="true">
              <FontAwesomeIcon icon={getToastIcon(toast.variant)} />
            </span>
            <span className="ald-toast__copy">
              <strong>{toast.title}</strong>
              <span>{toast.message}</span>
            </span>
            <button
              className="ald-toast__close"
              type="button"
              onClick={dismissToast}
              aria-label="Dismiss notification"
            >
              <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}
