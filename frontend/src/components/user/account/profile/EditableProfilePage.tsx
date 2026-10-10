"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardList,
  faEnvelope,
  faLocationDot,
  faLock,
  faPhone,
  faRotate,
  faShieldHalved,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { getAuthToken } from "@/lib/auth/authStorage";
import type { AuthUser } from "@/lib/auth/authTypes";
import {
  getCustomerProfile,
  getCustomerProfileErrorMessage,
  getCustomerProfileValidationErrors,
  updateCustomerPassword,
  updateCustomerProfile,
} from "@/lib/customerProfileApi";

type ProfileForm = {
  name: string;
  email: string;
  contact_number: string;
  address: string;
};

type PasswordForm = {
  current_password: string;
  password: string;
  password_confirmation: string;
};

type FieldErrors = Record<string, string[]>;

const EMPTY_PASSWORD: PasswordForm = {
  current_password: "",
  password: "",
  password_confirmation: "",
};

function profileFormFromUser(user: AuthUser): ProfileForm {
  return {
    name: user.name,
    email: user.email,
    contact_number: user.customer?.contact_number ?? "",
    address: user.customer?.address ?? "",
  };
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function EditableProfilePage() {
  const { isLoading: authLoading, user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [values, setValues] = useState<ProfileForm>({
    name: "",
    email: "",
    contact_number: "",
    address: "",
  });
  const [password, setPassword] = useState<PasswordForm>(EMPTY_PASSWORD);
  const [profileErrors, setProfileErrors] = useState<FieldErrors>({});
  const [passwordErrors, setPasswordErrors] = useState<FieldErrors>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const loadProfile = useCallback((signal?: AbortSignal) => {
    const token = getAuthToken();

    if (!token) {
      if (!signal?.aborted) {
        setLoadError("Your customer session is unavailable. Please sign in again.");
        setLoading(false);
      }
      return Promise.resolve();
    }

    return getCustomerProfile(token, signal)
      .then((response) => {
        if (!signal?.aborted) {
          setProfile(response.user);
          setValues(profileFormFromUser(response.user));
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (!signal?.aborted) {
          setLoadError(getCustomerProfileErrorMessage(error, "Unable to load your profile. Please try again."));
        }
      })
      .finally(() => {
        if (!signal?.aborted) setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();

    const token = getAuthToken();

    if (!token) {
      void Promise.resolve().then(() => {
        if (!controller.signal.aborted) {
          setLoadError("Your customer session is unavailable. Please sign in again.");
          setLoading(false);
        }
      });
      return () => controller.abort();
    }

    void getCustomerProfile(token, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) {
          setProfile(response.user);
          setValues(profileFormFromUser(response.user));
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(getCustomerProfileErrorMessage(error, "Unable to load your profile. Please try again."));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [user]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextValues = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      contact_number: values.contact_number.trim(),
      address: values.address.trim(),
    };
    const errors: FieldErrors = {};

    if (!nextValues.name) errors.name = ["Enter your full name."];
    else if (nextValues.name.length > 255) errors.name = ["Use 255 characters or fewer."];
    if (!nextValues.email) errors.email = ["Enter your email address."];
    else if (!/^\S+@\S+\.\S+$/.test(nextValues.email)) errors.email = ["Enter a valid email address."];
    if (!nextValues.contact_number) errors.contact_number = ["Enter your contact number."];
    else if (nextValues.contact_number.length > 30) errors.contact_number = ["Use 30 characters or fewer."];
    if (nextValues.address.length > 255) errors.address = ["Use 255 characters or fewer."];

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setProfileError("Your customer session is unavailable. Please sign in again.");
      return;
    }

    setSavingProfile(true);
    setProfileError(null);
    setProfileErrors({});

    try {
      const response = await updateCustomerProfile(token, nextValues);
      setProfile(response.user);
      setValues(profileFormFromUser(response.user));
      updateUser({ name: response.user.name, email: response.user.email, customer: response.user.customer });
      showToast({ title: "Profile updated", message: "Your customer account details have been saved." });
    } catch (error) {
      setProfileError(getCustomerProfileErrorMessage(error));
      setProfileErrors(getCustomerProfileValidationErrors(error));
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: FieldErrors = {};
    if (!password.current_password) errors.current_password = ["Enter your current password."];
    if (password.password.length < 8) errors.password = ["Use at least 8 characters."];
    if (password.password_confirmation !== password.password) errors.password_confirmation = ["The password confirmation does not match."];

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setPasswordError("Your customer session is unavailable. Please sign in again.");
      return;
    }

    setSavingPassword(true);
    setPasswordError(null);
    setPasswordErrors({});

    try {
      const response = await updateCustomerPassword(token, password);
      setPassword(EMPTY_PASSWORD);
      showToast({ title: "Password updated", message: response.message });
    } catch (error) {
      setPasswordError(getCustomerProfileErrorMessage(error));
      setPasswordErrors(getCustomerProfileValidationErrors(error));
    } finally {
      setSavingPassword(false);
    }
  };

  if (authLoading || !user || loading) {
    return <div className="customer-profile-page"><div className="customer-profile-loading" aria-live="polite">Loading your profile…</div></div>;
  }

  if (loadError || !profile) {
    return (
      <div className="customer-profile-page">
        <section className="customer-profile-error" role="alert">
          <p className="customer-orders-eyebrow">Customer Account</p>
          <h1>Unable to load your profile</h1>
          <p>{loadError ?? "The profile response was not available."}</p>
          <button type="button" className="customer-profile-action customer-profile-action--primary" onClick={() => { setLoading(true); setLoadError(null); void loadProfile(); }}>
            <FontAwesomeIcon icon={faRotate} aria-hidden="true" /> Try again
          </button>
        </section>
      </div>
    );
  }

  const initials = getInitials(profile.name) || "ALD";
  const isProfileDirty = values.name !== profile.name || values.email !== profile.email || values.contact_number !== (profile.customer?.contact_number ?? "") || values.address !== (profile.customer?.address ?? "");

  return (
    <div className="customer-profile-page">
      <section className="customer-orders-hero" aria-labelledby="customer-profile-page-title">
        <div className="customer-orders-shell">
          <p className="customer-orders-eyebrow">Customer Account</p>
          <h1 id="customer-profile-page-title">Profile</h1>
          <p>Update the account details and password you use with ALD Motorshop.</p>
        </div>
      </section>

      <div className="customer-orders-shell customer-profile-content">
        <main className="customer-profile-main">
          <section className="customer-profile-card" aria-labelledby="profile-details-title">
            <div className="customer-profile-card-header">
              <span className="customer-profile-avatar" aria-hidden="true">{initials}</span>
              <div>
                <p className="customer-orders-eyebrow">Signed-in customer</p>
                <h2 id="profile-details-title">{profile.name}</h2>
                <p>Keep your contact details current for order updates.</p>
              </div>
            </div>

            <form className="customer-profile-form" onSubmit={saveProfile} noValidate>
              <ProfileSectionHeader icon={faUser} title="Personal details" description="These details are used for your account and order communication." />
              <div className="customer-profile-form-grid">
                <ProfileField id="customer-profile-name" label="Full name" icon={faUser} value={values.name} error={profileErrors.name?.[0]} autoComplete="name" onChange={(name) => setValues((current) => ({ ...current, name }))} />
                <ProfileField id="customer-profile-email" label="Email address" icon={faEnvelope} type="email" value={values.email} error={profileErrors.email?.[0]} autoComplete="email" onChange={(email) => setValues((current) => ({ ...current, email }))} />
                <ProfileField id="customer-profile-contact-number" label="Contact number" icon={faPhone} type="tel" value={values.contact_number} error={profileErrors.contact_number?.[0]} autoComplete="tel" onChange={(contact_number) => setValues((current) => ({ ...current, contact_number }))} />
                <ProfileField id="customer-profile-address" label="Address" icon={faLocationDot} value={values.address} error={profileErrors.address?.[0]} autoComplete="street-address" multiline onChange={(address) => setValues((current) => ({ ...current, address }))} />
              </div>
              {profileError ? <p className="customer-profile-form-error" role="alert">{profileError}</p> : null}
              <div className="customer-profile-form-footer"><button type="submit" className="customer-profile-action customer-profile-action--primary" disabled={savingProfile || !isProfileDirty}>{savingProfile ? "Saving…" : "Save changes"}</button></div>
            </form>
          </section>

          <form className="customer-profile-card customer-profile-form" onSubmit={savePassword} noValidate>
            <ProfileSectionHeader icon={faLock} title="Change password" description="Confirm your current password before choosing a new one." />
            <div className="customer-profile-form-grid">
              <ProfileField id="customer-current-password" label="Current password" icon={faLock} type="password" value={password.current_password} error={passwordErrors.current_password?.[0]} autoComplete="current-password" onChange={(current_password) => setPassword((current) => ({ ...current, current_password }))} />
              <ProfileField id="customer-new-password" label="New password" icon={faLock} type="password" value={password.password} error={passwordErrors.password?.[0]} autoComplete="new-password" onChange={(passwordValue) => setPassword((current) => ({ ...current, password: passwordValue }))} />
              <ProfileField id="customer-confirm-password" label="Confirm new password" icon={faLock} type="password" value={password.password_confirmation} error={passwordErrors.password_confirmation?.[0]} autoComplete="new-password" onChange={(password_confirmation) => setPassword((current) => ({ ...current, password_confirmation }))} />
            </div>
            {passwordError ? <p className="customer-profile-form-error" role="alert">{passwordError}</p> : null}
            <div className="customer-profile-form-footer"><button type="submit" className="customer-profile-action customer-profile-action--secondary" disabled={savingPassword}>{savingPassword ? "Updating…" : "Update password"}</button></div>
          </form>
        </main>

        <aside className="customer-profile-aside" aria-labelledby="profile-actions-title">
          <div className="customer-profile-aside-heading"><FontAwesomeIcon icon={faShieldHalved} aria-hidden="true" /><h2 id="profile-actions-title">Account shortcuts</h2></div>
          <p>Continue browsing your requests or use the public tracking page to check an order reference.</p>
          <div className="customer-profile-links">
            <Link className="customer-profile-link" href="/account/orders"><FontAwesomeIcon icon={faClipboardList} aria-hidden="true" /> My Orders</Link>
            <Link className="customer-profile-link" href="/track-order"><FontAwesomeIcon icon={faClipboardList} aria-hidden="true" /> Track Order</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ProfileSectionHeader({ icon, title, description }: { icon: typeof faUser; title: string; description: string }) {
  return <div className="customer-profile-section-heading"><span className="customer-profile-section-icon"><FontAwesomeIcon icon={icon} aria-hidden="true" /></span><div><h2>{title}</h2><p>{description}</p></div></div>;
}

function ProfileField({ id, label, icon, value, error, type = "text", autoComplete, multiline = false, onChange }: { id: string; label: string; icon: typeof faUser; value: string; error?: string; type?: string; autoComplete?: string; multiline?: boolean; onChange: (value: string) => void }) {
  const errorId = `${id}-error`;
  const fieldProps = {
    id,
    value,
    autoComplete,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? errorId : undefined,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value),
  };

  return <div className="customer-profile-field"><label htmlFor={id}><FontAwesomeIcon icon={icon} aria-hidden="true" />{label}</label>{multiline ? <textarea {...fieldProps} rows={3} /> : <input {...fieldProps} type={type} />}{error ? <p id={errorId} className="customer-profile-field-error" role="alert">{error}</p> : null}</div>;
}
