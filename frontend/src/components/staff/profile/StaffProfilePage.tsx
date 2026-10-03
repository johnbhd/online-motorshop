"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleUser,
  faPenToSquare,
  faRotateRight,
  faSave,
} from "@fortawesome/free-solid-svg-icons";
import StaffPageHeader from "@/components/staff/StaffPageHeader";
import { useAuth } from "@/components/auth/AuthProvider";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getStaffProfile,
  getStaffProfileErrorMessage,
  StaffProfileApiError,
  updateStaffProfile,
} from "./staffProfileApi";
import type {
  StaffProfileResponse,
  StaffProfileValidationErrors,
} from "./staffProfileTypes";

type ProfileForm = {
  name: string;
  email: string;
};

const emptyForm: ProfileForm = {
  name: "",
  email: "",
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not available"
    : new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(date);
}

function profileFormFromResponse(response: StaffProfileResponse): ProfileForm {
  return {
    name: response.user.name,
    email: response.user.email,
  };
}

function ProfileLoadingState() {
  return (
    <section
      className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-4">
        <div className="size-20 animate-pulse rounded-full bg-slate-200" />
        <div className="space-y-3">
          <div className="h-5 w-44 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
      <span className="sr-only">Loading Staff profile</span>
    </section>
  );
}

function ReadOnlyDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold text-[#0B1930]">
        {value}
      </dd>
    </div>
  );
}

function ProfileField({
  id,
  label,
  type,
  value,
  onChange,
  disabled,
  error,
  autoComplete,
}: {
  id: keyof ProfileForm;
  label: string;
  type: "email" | "text";
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  error?: string;
  autoComplete: string;
}) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-[#0B1930]">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`mt-2 h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${error ? "border-red-400" : "border-slate-300"}`}
      />
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function StaffProfilePage() {
  const { isLoading: isAuthLoading, updateUser, user } = useAuth();
  const [profile, setProfile] = useState<StaffProfileResponse | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<StaffProfileValidationErrors>({});
  const [reloadNonce, setReloadNonce] = useState(0);

  const loadProfile = useCallback(async (signal?: AbortSignal) => {
    const token = getAuthToken();

    if (!token) {
      setProfile(null);
      setIsLoading(false);
      setError("Your Staff session has expired. Please sign in again.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getStaffProfile(token, signal);
      setProfile(response);
      setForm(profileFormFromResponse(response));
    } catch (requestError) {
      if (
        requestError instanceof DOMException &&
        requestError.name === "AbortError"
      ) {
        return;
      }

      setProfile(null);
      setError(
        getStaffProfileErrorMessage(
          requestError,
          "Unable to load Staff profile. Please try again.",
        ),
      );
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading || user?.role !== "staff") {
      return;
    }

    const controller = new AbortController();
    const refresh = window.setTimeout(
      () => void loadProfile(controller.signal),
      0,
    );

    return () => {
      window.clearTimeout(refresh);
      controller.abort();
    };
  }, [isAuthLoading, loadProfile, reloadNonce, user?.role]);

  const isDirty = useMemo(() => {
    if (!profile) {
      return false;
    }

    return (
      form.name !== profile.user.name || form.email !== profile.user.email
    );
  }, [form.email, form.name, profile]);

  const handleCancel = () => {
    if (!profile) {
      return;
    }

    setForm(profileFormFromResponse(profile));
    setFieldErrors({});
    setSaveError(null);
    setSuccessMessage(null);
    setIsEditing(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profile || !isDirty || isSaving) {
      return;
    }

    const token = getAuthToken();

    if (!token) {
      setSaveError("Your Staff session has expired. Please sign in again.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSuccessMessage(null);
    setFieldErrors({});

    try {
      const response = await updateStaffProfile(token, {
        name: form.name.trim(),
        email: form.email.trim(),
      });

      setProfile(response);
      setForm(profileFormFromResponse(response));
      setIsEditing(false);
      setSuccessMessage("Profile updated successfully.");
      updateUser({
        name: response.user.name,
        email: response.user.email,
      });
    } catch (requestError) {
      if (requestError instanceof StaffProfileApiError) {
        setFieldErrors(requestError.errors);
      }

      setSaveError(
        getStaffProfileErrorMessage(
          requestError,
          "Unable to update profile. Please try again.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <StaffPageHeader
          eyebrow="Account"
          title="Staff Profile"
          description="View and update your authenticated Staff account."
        />
        <ProfileLoadingState />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="space-y-5">
        <StaffPageHeader
          eyebrow="Account"
          title="Staff Profile"
          description="View and update your authenticated Staff account."
        />
        <section className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="font-semibold text-[#0B1930]">Unable to load profile</p>
          <p className="mt-2 text-sm text-slate-500">
            {error ?? "The profile response was not available."}
          </p>
          <button
            type="button"
            onClick={() => setReloadNonce((nonce) => nonce + 1)}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#0B1930] px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <FontAwesomeIcon icon={faRotateRight} aria-hidden="true" />
            Retry
          </button>
        </section>
      </div>
    );
  }

  const branchName = profile.branch?.name ?? "Not assigned";
  const saveButtonDisabled = !isDirty || isSaving;

  return (
    <div className="space-y-5">
      <StaffPageHeader
        eyebrow="Account"
        title="Staff Profile"
        description="View and update your authenticated Staff account."
      />

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-white px-5 py-6 text-[#0B1930] sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="grid size-20 shrink-0 place-items-center rounded-full bg-slate-100 text-4xl text-orange-500 ring-1 ring-slate-200">
              <FontAwesomeIcon icon={faCircleUser} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="mt-1 truncate text-2xl font-bold">{profile.user.name}</h2>
              <p className="mt-1 truncate text-sm text-slate-500">
                {profile.user.email}
              </p>
              <p className="mt-3 text-sm text-slate-500">
                {profile.user.role} · {branchName}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-8" noValidate>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#0B1930]">
                Personal information
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Only fields supported by the Staff account schema can be edited.
              </p>
            </div>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setSuccessMessage(null);
                  setSaveError(null);
                  setIsEditing(true);
                }}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
              >
                <FontAwesomeIcon icon={faPenToSquare} aria-hidden="true" />
                Edit Profile
              </button>
            ) : null}
          </div>

          {successMessage ? (
            <p
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
              role="status"
            >
              {successMessage}
            </p>
          ) : null}

          {saveError ? (
            <p
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              role="alert"
            >
              {saveError}
            </p>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            <ProfileField
              id="name"
              label="Name"
              type="text"
              value={form.name}
              onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              disabled={!isEditing || isSaving}
              error={fieldErrors.name?.[0]}
              autoComplete="name"
            />
            <ProfileField
              id="email"
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) => setForm((current) => ({ ...current, email: value }))}
              disabled={!isEditing || isSaving}
              error={fieldErrors.email?.[0]}
              autoComplete="email"
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#0B1930]">Account details</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ReadOnlyDetail label="Staff ID" value={String(profile.user.id)} />
              <ReadOnlyDetail label="Role" value={profile.user.role} />
              <ReadOnlyDetail label="Assigned Branch" value={branchName} />
              <ReadOnlyDetail
                label="Account Created"
                value={formatDate(profile.user.created_at)}
              />
            </dl>
          </div>

          {isEditing ? (
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveButtonDisabled}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FontAwesomeIcon icon={faSave} aria-hidden="true" />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          ) : null}
        </form>
      </section>
    </div>
  );
}
