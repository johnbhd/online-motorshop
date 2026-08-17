"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faEye, faEyeSlash, faLock, faPhone, faUser } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field"><label className="auth-sr-only" htmlFor="name">Full name</label><span className="auth-icon-left" aria-hidden="true"><FontAwesomeIcon icon={faUser} /></span><input id="name" name="name" type="text" placeholder="Full Name" autoComplete="name" required /></div>
        <div className="auth-field"><label className="auth-sr-only" htmlFor="register-email">Email address</label><span className="auth-icon-left" aria-hidden="true"><FontAwesomeIcon icon={faEnvelope} /></span><input id="register-email" name="email" type="email" placeholder="Email Address" autoComplete="email" required /></div>
        <div className="auth-field"><label className="auth-sr-only" htmlFor="phone">Contact number</label><span className="auth-icon-left" aria-hidden="true"><FontAwesomeIcon icon={faPhone} /></span><input id="phone" name="phone" type="tel" placeholder="Contact Number" autoComplete="tel" required /></div>
        <div className="auth-field"><label className="auth-sr-only" htmlFor="password">Password</label><span className="auth-icon-left" aria-hidden="true"><FontAwesomeIcon icon={faLock} /></span><input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Password" autoComplete="new-password" required /><button type="button" className="auth-icon-right" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}><FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} /></button></div>
        <div className="auth-field"><label className="auth-sr-only" htmlFor="password-confirmation">Confirm password</label><span className="auth-icon-left" aria-hidden="true"><FontAwesomeIcon icon={faLock} /></span><input id="password-confirmation" name="password_confirmation" type={showPasswordConfirmation ? "text" : "password"} placeholder="Confirm Password" autoComplete="new-password" required /><button type="button" className="auth-icon-right" onClick={() => setShowPasswordConfirmation((current) => !current)} aria-label={showPasswordConfirmation ? "Hide password" : "Show password"}><FontAwesomeIcon icon={showPasswordConfirmation ? faEyeSlash : faEye} /></button></div>
        <button type="submit" className="auth-primary-button">Create Account</button>
      </form>
      <button type="button" className="auth-secondary-button"><FontAwesomeIcon icon={faGoogle} />&nbsp; Continue with Google</button>
      <p className="auth-register-line">Already have an account? <Link href="/auth/login" className="auth-register-link">Sign in</Link></p>
      <div className="auth-divider"><hr /><span>OR</span><hr /></div>
      <button type="button" className="auth-secondary-button"><FontAwesomeIcon icon={faUser} />&nbsp; Continue as a Guest</button>
      <p className="auth-footnote">No account needed. Browse products, add items to your cart, and submit an order request immediately.</p>
    </>
  );
}
