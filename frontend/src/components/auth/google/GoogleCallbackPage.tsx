"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { useAuth } from "@/components/auth/AuthProvider";
import { GoogleAuthButton } from "@/components/auth/google/GoogleAuthButton";
import {
  exchangeGoogleAuthCode,
  getGoogleAuthErrorMessage,
  getGoogleAuthErrorMessageForCode,
  getSafeGoogleReturnTo,
} from "@/lib/auth/authApi";

export function GoogleCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { establishSession } = useAuth();
  const hasStarted = useRef(false);
  const code = searchParams.get("code");
  const errorCode = searchParams.get("error");
  const returnTo = getSafeGoogleReturnTo(searchParams.get("return_to"));
  const queryError = errorCode
    ? getGoogleAuthErrorMessageForCode(errorCode)
    : code
      ? ""
      : "Unable to complete Google sign-in. Please try again.";
  const [exchangeError, setExchangeError] = useState("");
  const error = exchangeError || queryError;

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;

    if (errorCode || !code) {
      return;
    }

    const handoffCode = code;

    async function exchangeCode() {
      try {
        const response = await exchangeGoogleAuthCode(handoffCode);
        const user = await establishSession(response.token);

        if (user.role !== "customer") {
          setExchangeError(
            "Google sign-in is available only for customer accounts. Please use the appropriate Admin or Staff sign-in.",
          );
          return;
        }

        router.replace(
          getSafeGoogleReturnTo(response.return_to ?? returnTo),
        );
      } catch (requestError) {
        setExchangeError(getGoogleAuthErrorMessage(requestError));
      }
    }

    void exchangeCode();
  }, [code, errorCode, establishSession, router, returnTo]);

  return (
    <AuthCard
      title={error ? "Google Sign-In Needs Attention" : "Signing You In"}
      subtitle={
        error
          ? "Your normal ALD Motorshop sign-in remains available."
          : "Please wait while we securely finish your Google sign-in."
      }
    >
      {error ? (
        <div className="auth-google-state">
          <p className="auth-feedback error" role="alert" aria-live="assertive">
            {error}
          </p>
          <GoogleAuthButton returnTo={returnTo} label="Try Google again" />
          <Link href="/auth/login" className="auth-secondary-button">
            Back to Sign In
          </Link>
        </div>
      ) : (
        <p className="auth-google-loading" role="status" aria-live="polite">
          Signing you in with Google…
        </p>
      )}
    </AuthCard>
  );
}
