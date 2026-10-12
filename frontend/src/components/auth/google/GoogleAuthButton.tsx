"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { getSafeGoogleReturnTo } from "@/lib/auth/authApi";

type GoogleAuthButtonProps = {
  returnTo?: string | null;
  label?: string;
  disabled?: boolean;
};

export function GoogleAuthButton({
  returnTo,
  label = "Continue with Google",
  disabled = false,
}: GoogleAuthButtonProps) {
  const [isStarting, setIsStarting] = useState(false);

  function handleStart() {
    if (disabled || isStarting) {
      return;
    }

    const requestedReturnTo =
      returnTo ?? new URL(window.location.href).searchParams.get("return_to");
    const safeReturnTo = getSafeGoogleReturnTo(requestedReturnTo);
    const query = new URLSearchParams({ return_to: safeReturnTo });

    setIsStarting(true);
    // The OAuth start handler must perform a document navigation so its redirect reaches Laravel and Google.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/api/auth/google/start?${query.toString()}`;
  }

  const isDisabled = disabled || isStarting;

  return (
    <button
      type="button"
      className="auth-secondary-button auth-google-button"
      onClick={handleStart}
      disabled={isDisabled}
      aria-busy={isStarting}
    >
      <FontAwesomeIcon icon={faGoogle} aria-hidden="true" />
      {isStarting ? "Starting Google sign-in…" : label}
    </button>
  );
}
