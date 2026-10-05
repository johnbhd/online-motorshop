"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faEye,
  faEyeSlash,
  faLock,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import {
  getAuthErrorMessage,
  getRedirectPathForRole,
  login,
} from "@/lib/auth/authApi";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { useAuth } from "./AuthProvider";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { establishSession } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (!window.location.search.includes("registered=1")) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSuccess("Account created successfully. You can now sign in.");
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    setIsSubmitting(true);
    setError("");

    try {
      const response = await login({ email, password });
      const user = await establishSession(response.token);

      setSuccess("");
      showToast({
        title:
          user.role === "admin"
            ? "Admin login successful"
            : user.role === "staff"
              ? "Staff login successful"
              : "Customer login successful",
        message:
          user.role === "admin"
            ? "Welcome to the Admin Portal."
            : user.role === "staff"
              ? "Welcome to the Staff Portal."
              : "Welcome back to ALD Motorshop.",
      });
      router.replace(getRedirectPathForRole(user.role));
    } catch (requestError) {
      setSuccess("");
      setError(
        getAuthErrorMessage(
          requestError,
          "Unable to sign in. Please check your credentials and try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form className="auth-form" onSubmit={handleSubmit}>
        {success ? (
          <p className="auth-feedback success" aria-live="polite">
            {success}
          </p>
        ) : null}
        {error ? (
          <p className="auth-feedback error" role="alert" aria-live="assertive">
            {error}
          </p>
        ) : null}
        <div className="auth-field">
          <label className="auth-sr-only" htmlFor="login-email">
            Email address
          </label>
          <span className="auth-icon-left" aria-hidden="true">
            <FontAwesomeIcon icon={faEnvelope} />
          </span>
          <input
            id="login-email"
            name="email"
            type="email"
            placeholder="Email Address"
            autoComplete="email"
            required
          />
        </div>
        <div className="auth-field">
          <label className="auth-sr-only" htmlFor="login-password">
            Password
          </label>
          <span className="auth-icon-left" aria-hidden="true">
            <FontAwesomeIcon icon={faLock} />
          </span>
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            autoComplete="current-password"
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
        </div>
        <p className="auth-register-line">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="auth-register-link">
            Register here
          </Link>
        </p>
        <button
          type="submit"
          className="auth-primary-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing In…" : "Sign In"}
        </button>
      </form>
      <button type="button" className="auth-secondary-button">
        <FontAwesomeIcon icon={faGoogle} />&nbsp; Continue with Google
      </button>
      <div className="auth-divider"><hr /><span>OR</span><hr /></div>
      <Link href="/" className="auth-secondary-button">
        <FontAwesomeIcon icon={faUser} />&nbsp; Continue as a Guest
      </Link>
      <p className="auth-footnote">No account needed. Browse products, add items to your cart, and submit an order request immediately.</p>
    </>
  );
}
