"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState<boolean>(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
  }

  return (
    <>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field"><label className="auth-sr-only" htmlFor="name">Full name</label><span className="auth-icon-left" aria-hidden="true">●</span><input id="name" name="name" type="text" placeholder="Full Name" autoComplete="name" required /></div>
        <div className="auth-field"><label className="auth-sr-only" htmlFor="register-email">Email address</label><span className="auth-icon-left" aria-hidden="true">✉</span><input id="register-email" name="email" type="email" placeholder="Email Address" autoComplete="email" required /></div>
        <div className="auth-field"><label className="auth-sr-only" htmlFor="phone">Contact number</label><span className="auth-icon-left" aria-hidden="true">☎</span><input id="phone" name="phone" type="tel" placeholder="Contact Number" autoComplete="tel" required /></div>
        <div className="auth-field"><label className="auth-sr-only" htmlFor="password">Password</label><span className="auth-icon-left" aria-hidden="true">▣</span><input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Password" autoComplete="new-password" required /><button type="button" className="auth-icon-right" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "◉" : "◌"}</button></div>
        <div className="auth-field"><label className="auth-sr-only" htmlFor="password-confirmation">Confirm password</label><span className="auth-icon-left" aria-hidden="true">▣</span><input id="password-confirmation" name="password_confirmation" type={showPasswordConfirmation ? "text" : "password"} placeholder="Confirm Password" autoComplete="new-password" required /><button type="button" className="auth-icon-right" onClick={() => setShowPasswordConfirmation((current) => !current)} aria-label={showPasswordConfirmation ? "Hide password" : "Show password"}>{showPasswordConfirmation ? "◉" : "◌"}</button></div>
        <button type="submit" className="auth-primary-button">Create Account</button>
      </form>

      <button type="button" className="auth-secondary-button">G&nbsp; Continue with Google</button>
      <p className="auth-register-line">Already have an account? <Link href="/auth/login" className="auth-register-link">Sign in</Link></p>
      <div className="auth-divider"><hr /><span>OR</span><hr /></div>
      <button type="button" className="auth-secondary-button">●&nbsp; Continue as a Guest</button>
      <p className="auth-footnote">No account needed. Browse products, add items to your cart, and submit an order request immediately.</p>
    </>
  );
}
