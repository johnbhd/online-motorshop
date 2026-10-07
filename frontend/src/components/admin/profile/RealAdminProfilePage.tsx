"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleUser,
  faLock,
  faRotate,
  faShieldHalved,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getAdminProfile,
  getAdminProfileErrorMessage,
  getAdminProfileValidationErrors,
  updateAdminPassword,
  updateAdminProfile,
} from "@/lib/adminProfileApi";
import type { AdminProfile } from "@/lib/adminProfileTypes";

type ProfileForm = {
  name: string;
  email: string;
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

export default function RealAdminProfilePage() {
  const { updateUser } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [values, setValues] = useState<ProfileForm>({ name: "", email: "" });
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
      return Promise.resolve().then(() => {
        if (!signal?.aborted) {
          setLoadError("Your Admin session is unavailable. Please sign in again.");
          setLoading(false);
        }
      });
    }

    return getAdminProfile(token, signal)
      .then((response) => {
        if (!signal?.aborted) {
          setProfile(response.user);
          setValues({ name: response.user.name, email: response.user.email });
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (!signal?.aborted) {
          setLoadError(getAdminProfileErrorMessage(error));
        }
      })
      .finally(() => {
        if (!signal?.aborted) {
          setLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadProfile(controller.signal);

    return () => controller.abort();
  }, [loadProfile]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = values.name.trim();
    const email = values.email.trim().toLowerCase();
    const errors: FieldErrors = {};

    if (!name) {
      errors.name = ["Enter your name."];
    } else if (name.length > 255) {
      errors.name = ["Use 255 characters or fewer."];
    }

    if (!email) {
      errors.email = ["Enter your email address."];
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = ["Enter a valid email address."];
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    const token = getAuthToken();

    if (!token) {
      setProfileError("Your Admin session is unavailable. Please sign in again.");
      return;
    }

    setSavingProfile(true);
    setProfileError(null);
    setProfileErrors({});

    try {
      const response = await updateAdminProfile(token, { name, email });
      setProfile(response.user);
      setValues({ name: response.user.name, email: response.user.email });
      updateUser({ name: response.user.name, email: response.user.email });
      showToast({
        title: "Profile updated",
        message: "Your Admin account details have been saved.",
      });
    } catch (error) {
      setProfileError(getAdminProfileErrorMessage(error));
      setProfileErrors(getAdminProfileValidationErrors(error));
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: FieldErrors = {};

    if (!password.current_password) {
      errors.current_password = ["Enter your current password."];
    }

    if (password.password.length < 8) {
      errors.password = ["Use at least 8 characters."];
    }

    if (password.password_confirmation !== password.password) {
      errors.password_confirmation = ["The password confirmation does not match."];
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    const token = getAuthToken();

    if (!token) {
      setPasswordError("Your Admin session is unavailable. Please sign in again.");
      return;
    }

    setSavingPassword(true);
    setPasswordError(null);
    setPasswordErrors({});

    try {
      const response = await updateAdminPassword(token, password);
      setPassword(EMPTY_PASSWORD);
      showToast({ title: "Password updated", message: response.message });
    } catch (error) {
      setPasswordError(getAdminProfileErrorMessage(error));
      setPasswordErrors(getAdminProfileValidationErrors(error));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
          Admin Portal
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[#0B1930]">My Profile</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Review and update your own Admin account details and sign-in password.
        </p>
      </header>

      {loadError ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800" role="alert">
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setLoadError(null);
              void loadProfile();
            }}
            className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-300 px-3 font-semibold hover:bg-red-100"
          >
            <FontAwesomeIcon icon={faRotate} aria-hidden="true" /> Try again
          </button>
        </section>
      ) : loading || !profile ? (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="Loading profile" aria-live="polite">
          <div className="h-14 w-14 animate-pulse rounded-full bg-slate-100" />
          <div className="h-10 animate-pulse rounded bg-slate-100" />
          <div className="h-10 animate-pulse rounded bg-slate-100" />
        </section>
      ) : (
        <>
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
              <span className="grid size-16 shrink-0 place-items-center rounded-full bg-slate-100 text-2xl text-[#0B1930] ring-1 ring-slate-200">
                <FontAwesomeIcon icon={faCircleUser} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-bold text-[#0B1930]">{profile.name}</h2>
                <p className="mt-1 truncate text-sm text-slate-500">{profile.email}</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold capitalize text-orange-800">
                <FontAwesomeIcon icon={faShieldHalved} aria-hidden="true" />
                {profile.role}
              </span>
            </div>
            <dl className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              <ReadOnlyValue label="Account status" value={profile.status} />
              <ReadOnlyValue
                label="Account created"
                value={profile.created_at ? new Date(profile.created_at).toLocaleDateString("en-PH") : "Not available"}
              />
            </dl>
          </section>

          <form onSubmit={saveProfile} noValidate className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              icon={faUser}
              title="Personal details"
              description="Only your own name and email can be changed here. Role and account status are managed separately."
            />
            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <ProfileField
                id="admin-profile-name"
                label="Full name"
                value={values.name}
                error={profileErrors.name?.[0]}
                autoComplete="name"
                onChange={(name) => setValues((current) => ({ ...current, name }))}
              />
              <ProfileField
                id="admin-profile-email"
                label="Email address"
                type="email"
                value={values.email}
                error={profileErrors.email?.[0]}
                autoComplete="email"
                onChange={(email) => setValues((current) => ({ ...current, email }))}
              />
            </div>
            {profileError ? (
              <p className="mx-5 mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:mx-6" role="alert">
                {profileError}
              </p>
            ) : null}
            <div className="flex justify-end border-t border-slate-100 p-5 sm:px-6">
              <button
                type="submit"
                disabled={savingProfile || (values.name === profile.name && values.email === profile.email)}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-orange-600 px-5 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {savingProfile ? "Saving…" : "Save Profile"}
              </button>
            </div>
          </form>

          <form onSubmit={savePassword} noValidate className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              icon={faLock}
              title="Change password"
              description="Confirm your current password first. Other active API sessions will be signed out after a successful change."
            />
            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <ProfileField
                id="admin-current-password"
                label="Current password"
                type="password"
                value={password.current_password}
                error={passwordErrors.current_password?.[0]}
                autoComplete="current-password"
                onChange={(current_password) => setPassword((current) => ({ ...current, current_password }))}
              />
              <span className="hidden sm:block" aria-hidden="true" />
              <ProfileField
                id="admin-new-password"
                label="New password"
                type="password"
                value={password.password}
                error={passwordErrors.password?.[0]}
                autoComplete="new-password"
                onChange={(newValue) => setPassword((current) => ({ ...current, password: newValue }))}
              />
              <ProfileField
                id="admin-confirm-password"
                label="Confirm new password"
                type="password"
                value={password.password_confirmation}
                error={passwordErrors.password_confirmation?.[0]}
                autoComplete="new-password"
                onChange={(password_confirmation) => setPassword((current) => ({ ...current, password_confirmation }))}
              />
            </div>
            {passwordError ? (
              <p className="mx-5 mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:mx-6" role="alert">
                {passwordError}
              </p>
            ) : null}
            <div className="flex justify-end border-t border-slate-100 p-5 sm:px-6">
              <button
                type="submit"
                disabled={savingPassword}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0B1930] px-5 text-sm font-bold text-white hover:bg-[#152B4B] disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {savingPassword ? "Updating…" : "Update Password"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: typeof faUser;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 p-5 sm:p-6">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange-50 text-orange-600">
        <FontAwesomeIcon icon={icon} aria-hidden="true" />
      </span>
      <div>
        <h2 className="font-bold text-[#0B1930]">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function ProfileField({
  id,
  label,
  value,
  error,
  type = "text",
  autoComplete,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  type?: string;
  autoComplete?: string;
  onChange: (value: string) => void;
}) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-[#0B1930]">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        required={type !== "password" || id === "admin-current-password"}
        minLength={type === "password" && id === "admin-new-password" ? 8 : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#0B1930] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
      />
      {error ? (
        <p id={errorId} className="mt-1 text-xs font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ReadOnlyValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 font-medium capitalize text-[#0B1930]">{value}</dd>
    </div>
  );
}
