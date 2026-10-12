"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faEye, faEyeSlash, faLock } from "@fortawesome/free-solid-svg-icons";
import { AuthCard } from "@/components/auth/AuthCard";
import { useAuth } from "@/components/auth/AuthProvider";
import { GoogleAuthButton } from "@/components/auth/google/GoogleAuthButton";
import {
  AuthApiError,
  getGoogleAuthErrorMessage,
  getGoogleLinkProfile,
  getSafeGoogleReturnTo,
  linkGoogleAccount,
} from "@/lib/auth/authApi";
import type { AuthValidationErrors } from "@/lib/auth/authTypes";

export function GoogleLinkAccountPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { establishSession } = useAuth();
  const token = searchParams.get("token")?.trim() ?? "";
  const [email, setEmail] = useState("");
  const [returnTo, setReturnTo] = useState("/");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(
    token ? "" : "This Google account-link request is no longer valid.",
  );
  const [fieldErrors, setFieldErrors] = useState<AuthValidationErrors>({});

  useEffect(() => {
    let isCancelled = false;

    if (!token) {
      return () => {
        isCancelled = true;
      };
    }

    async function loadProfile() {
      try {
        const profile = await getGoogleLinkProfile(token);

        if (isCancelled) {
          return;
        }

        setEmail(profile.email);
        setReturnTo(getSafeGoogleReturnTo(profile.return_to));
      } catch (requestError) {
        if (!isCancelled) {
          setError(getGoogleAuthErrorMessage(requestError));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isCancelled = true;
    };
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || !token) {
      return;
    }

    if (!password) {
      setFieldErrors({ password: ["Please enter your ALD password."] });
      setError("Please enter your ALD password.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setFieldErrors({});

    try {
      const response = await linkGoogleAccount({
        link_token: token,
        password,
      });
      const user = await establishSession(response.token);

      if (user.role !== "customer") {
        setError(
          "Google sign-in is available only for customer accounts. Please use the appropriate Admin or Staff sign-in.",
        );
        return;
      }

      router.replace(getSafeGoogleReturnTo(response.return_to ?? returnTo));
    } catch (requestError) {
      setFieldErrors(
        requestError instanceof AuthApiError ? requestError.errors : {},
      );
      setError(getGoogleAuthErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  const passwordError = fieldErrors.password?.[0] ?? "";

  return (
    <AuthCard
      title="Link Google Account"
      subtitle="Google verified this email. Enter your current ALD password to securely connect it to your existing customer account."
    >
      {isLoading ? (
        <p className="auth-google-loading" role="status" aria-live="polite">
          Preparing your account link…
        </p>
      ) : error && !email ? (
        <div className="auth-google-state">
          <p className="auth-feedback error" role="alert" aria-live="assertive">
            {error}
          </p>
          <GoogleAuthButton returnTo={returnTo} label="Continue with Google Again" />
          <Link href="/auth/login" className="auth-secondary-button">
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error ? (
            <p className="auth-feedback error" role="alert" aria-live="assertive">
              {error}
            </p>
          ) : null}
          <div className="auth-field">
            <label className="auth-sr-only" htmlFor="google-link-email">
              Google verified email
            </label>
            <span className="auth-icon-left" aria-hidden="true">
              <FontAwesomeIcon icon={faEnvelope} />
            </span>
            <input
              id="google-link-email"
              type="email"
              value={email}
              readOnly
              className="auth-input-readonly"
              aria-describedby="google-link-email-help"
            />
            <span id="google-link-email-help" className="auth-field-note">
              Verified with Google
            </span>
          </div>
          <div className="auth-field">
            <label className="auth-sr-only" htmlFor="google-link-password">
              Current ALD password
            </label>
            <span className="auth-icon-left" aria-hidden="true">
              <FontAwesomeIcon icon={faLock} />
            </span>
            <input
              id="google-link-password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Current ALD Password"
              autoComplete="current-password"
              aria-invalid={Boolean(passwordError)}
              aria-describedby={passwordError ? "google-link-password-error" : undefined}
              required
            />
            <button
              type="button"
              className="auth-icon-right"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </button>
            {passwordError ? (
              <p id="google-link-password-error" className="auth-field-error">
                {passwordError}
              </p>
            ) : null}
          </div>
          <button
            type="submit"
            className="auth-primary-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Linking Google…" : "Link Google Account"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
