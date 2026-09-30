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
  getRedirectPathForRole,
  loginDemoUser,
} from "@/lib/auth/demoAuth";
import { useDemoAuth } from "./DemoAuthProvider";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const { setSession } = useDemoAuth();

  useEffect(() => {
    if (!window.location.search.includes("registered=1")) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSuccess("Account created successfully. You can now sign in.");
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const result = loginDemoUser(
      String(formData.get("email") ?? ""),
      String(formData.get("password") ?? ""),
    );

    if (!result.success) {
      setSuccess("");
      setError(result.error);
      return;
    }

    setError("");
    setSuccess("");
    setSession(result.session);
    router.replace(getRedirectPathForRole(result.session.role));
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
        <button type="submit" className="auth-primary-button">
          Sign In
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
