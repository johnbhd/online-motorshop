"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faEye, faEyeSlash, faLock, faUser } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label className="auth-sr-only" htmlFor="login-email">Email address</label>
          <span className="auth-icon-left" aria-hidden="true"><FontAwesomeIcon icon={faEnvelope} /></span>
          <input id="login-email" name="email" type="email" placeholder="Email Address" autoComplete="email" required />
        </div>
        <div className="auth-field">
          <label className="auth-sr-only" htmlFor="login-password">Password</label>
          <span className="auth-icon-left" aria-hidden="true"><FontAwesomeIcon icon={faLock} /></span>
          <input id="login-password" name="password" type={showPassword ? "text" : "password"} placeholder="Password" autoComplete="current-password" required />
          <button type="button" className="auth-icon-right" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>
            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
          </button>
        </div>
        <p className="auth-register-line">Don&apos;t have an account? <Link href="/auth/register" className="auth-register-link">Register here</Link></p>
        <button type="submit" className="auth-primary-button">Sign In</button>
      </form>
      <button type="button" className="auth-secondary-button"><FontAwesomeIcon icon={faGoogle} />&nbsp; Continue with Google</button>
      <div className="auth-divider"><hr /><span>OR</span><hr /></div>
      <button type="button" className="auth-secondary-button"><FontAwesomeIcon icon={faUser} />&nbsp; Continue as a Guest</button>
      <p className="auth-footnote">No account needed. Browse products, add items to your cart, and submit an order request immediately.</p>
    </>
  );
}
