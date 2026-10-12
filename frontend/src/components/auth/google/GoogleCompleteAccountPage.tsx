"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faEye,
  faEyeSlash,
  faLock,
  faPhone,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { AuthCard } from "@/components/auth/AuthCard";
import { useAuth } from "@/components/auth/AuthProvider";
import { GoogleAuthButton } from "@/components/auth/google/GoogleAuthButton";
import {
  AuthApiError,
  completeGoogleRegistration,
  getGoogleAuthErrorMessage,
  getGoogleSetupProfile,
  getSafeGoogleReturnTo,
} from "@/lib/auth/authApi";
import type { AuthValidationErrors } from "@/lib/auth/authTypes";

function firstError(errors: AuthValidationErrors, field: string) {
  return errors[field]?.[0] ?? "";
}

export function GoogleCompleteAccountPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { establishSession } = useAuth();
  const token = searchParams.get("token")?.trim() ?? "";
  const initializedToken = useRef<string | null>(null);
  const [profileName, setProfileName] = useState("");
  const [email, setEmail] = useState("");
  const [returnTo, setReturnTo] = useState("/account");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(
    token ? "" : "This Google sign-up link is no longer valid.",
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
        const profile = await getGoogleSetupProfile(token);

        if (isCancelled) {
          return;
        }

        if (initializedToken.current !== token) {
          initializedToken.current = token;
          setProfileName(profile.name);
          setFullName(profile.name);
          setEmail(profile.email);
        }

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

    const nextErrors: AuthValidationErrors = {};

    if (!fullName.trim()) {
      nextErrors.full_name = ["Please enter your full name."];
    }

    if (!phone.trim()) {
      nextErrors.phone = ["Please enter your contact number."];
    }

    if (!password) {
      nextErrors.password = ["Please enter a password."];
    } else if (password.length < 8) {
      nextErrors.password = ["Password must be at least 8 characters."];
    }

    if (!passwordConfirmation) {
      nextErrors.password_confirmation = [
        "Please confirm your password.",
      ];
    } else if (password !== passwordConfirmation) {
      nextErrors.password_confirmation = ["Passwords do not match."];
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError("Please review the highlighted fields.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setFieldErrors({});

    try {
      const response = await completeGoogleRegistration({
        setup_token: token,
        full_name: fullName.trim(),
        phone: phone.trim(),
        password,
        password_confirmation: passwordConfirmation,
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

  const fullNameError = firstError(fieldErrors, "full_name");
  const phoneError = firstError(fieldErrors, "phone");
  const passwordError = firstError(fieldErrors, "password");
  const passwordConfirmationError = firstError(
    fieldErrors,
    "password_confirmation",
  );

  return (
    <AuthCard
      title="Complete Your ALD Account"
      subtitle="Your Google account has been verified. Complete the remaining information to finish creating your ALD Motorshop account."
    >
      {isLoading ? (
        <p className="auth-google-loading" role="status" aria-live="polite">
          Preparing your Google account…
        </p>
      ) : error && !email ? (
        <div className="auth-google-state">
          <p className="auth-feedback error" role="alert" aria-live="assertive">
            {error}
          </p>
          <GoogleAuthButton returnTo={returnTo} label="Continue with Google Again" />
          <Link href="/auth/register" className="auth-secondary-button">
            Back to Register
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
            <label className="auth-sr-only" htmlFor="google-full-name">
              Full name
            </label>
            <span className="auth-icon-left" aria-hidden="true">
              <FontAwesomeIcon icon={faUser} />
            </span>
            <input
              id="google-full-name"
              name="full_name"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder={profileName || "Full Name"}
              autoComplete="name"
              aria-invalid={Boolean(fullNameError)}
              aria-describedby={fullNameError ? "google-full-name-error" : undefined}
              required
            />
            {fullNameError ? (
              <p id="google-full-name-error" className="auth-field-error">
                {fullNameError}
              </p>
            ) : null}
          </div>
          <div className="auth-field">
            <label className="auth-sr-only" htmlFor="google-email">
              Email address verified with Google
            </label>
            <span className="auth-icon-left" aria-hidden="true">
              <FontAwesomeIcon icon={faEnvelope} />
            </span>
            <input
              id="google-email"
              type="email"
              value={email}
              readOnly
              className="auth-input-readonly"
              aria-describedby="google-email-help"
            />
            <span id="google-email-help" className="auth-field-note">
              Verified with Google
            </span>
          </div>
          <div className="auth-field">
            <label className="auth-sr-only" htmlFor="google-phone">
              Contact number
            </label>
            <span className="auth-icon-left" aria-hidden="true">
              <FontAwesomeIcon icon={faPhone} />
            </span>
            <input
              id="google-phone"
              name="phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Contact Number"
              autoComplete="tel"
              aria-invalid={Boolean(phoneError)}
              aria-describedby={phoneError ? "google-phone-error" : undefined}
              required
            />
            {phoneError ? (
              <p id="google-phone-error" className="auth-field-error">
                {phoneError}
              </p>
            ) : null}
          </div>
          <div className="auth-field">
            <label className="auth-sr-only" htmlFor="google-password">
              Password
            </label>
            <span className="auth-icon-left" aria-hidden="true">
              <FontAwesomeIcon icon={faLock} />
            </span>
            <input
              id="google-password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              autoComplete="new-password"
              aria-invalid={Boolean(passwordError)}
              aria-describedby={passwordError ? "google-password-error" : undefined}
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
              <p id="google-password-error" className="auth-field-error">
                {passwordError}
              </p>
            ) : null}
          </div>
          <div className="auth-field">
            <label className="auth-sr-only" htmlFor="google-password-confirmation">
              Confirm password
            </label>
            <span className="auth-icon-left" aria-hidden="true">
              <FontAwesomeIcon icon={faLock} />
            </span>
            <input
              id="google-password-confirmation"
              name="password_confirmation"
              type={showPasswordConfirmation ? "text" : "password"}
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              placeholder="Confirm Password"
              autoComplete="new-password"
              aria-invalid={Boolean(passwordConfirmationError)}
              aria-describedby={
                passwordConfirmationError
                  ? "google-password-confirmation-error"
                  : undefined
              }
              required
            />
            <button
              type="button"
              className="auth-icon-right"
              onClick={() =>
                setShowPasswordConfirmation((current) => !current)
              }
              aria-label={
                showPasswordConfirmation ? "Hide password" : "Show password"
              }
            >
              <FontAwesomeIcon
                icon={showPasswordConfirmation ? faEyeSlash : faEye}
              />
            </button>
            {passwordConfirmationError ? (
              <p
                id="google-password-confirmation-error"
                className="auth-field-error"
              >
                {passwordConfirmationError}
              </p>
            ) : null}
          </div>
          <button
            type="submit"
            className="auth-primary-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving Account…" : "Complete Account"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
