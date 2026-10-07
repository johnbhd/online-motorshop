"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCreditCard,
  faImage,
  faRotate,
  faTrashCan,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getAdminPaymentSettings,
  getAdminSettingsErrorMessage,
  getAdminSettingsValidationErrors,
  saveAdminPaymentSettings,
} from "@/lib/adminSettingsApi";
import type { AdminPaymentSettings } from "@/lib/adminSettingsTypes";

type SettingsForm = {
  gcash_account_name: string;
  gcash_number: string;
  payment_instructions: string;
};

type FieldErrors = Record<string, string[]>;

const MAX_QR_SIZE = 5 * 1024 * 1024;
const ACCEPTED_QR_TYPES = ["image/jpeg", "image/png", "image/webp"];

function toForm(settings: AdminPaymentSettings): SettingsForm {
  return {
    gcash_account_name: settings.gcash_account_name ?? "",
    gcash_number: settings.gcash_number ?? "",
    payment_instructions: settings.payment_instructions ?? "",
  };
}

export default function RealAdminSettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<AdminPaymentSettings | null>(null);
  const [values, setValues] = useState<SettingsForm | null>(null);
  const [selectedQr, setSelectedQr] = useState<File | null>(null);
  const [removeQr, setRemoveQr] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [fileError, setFileError] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback((signal?: AbortSignal) => {
    const token = getAuthToken();

    if (!token) {
      return Promise.resolve().then(() => {
        if (!signal?.aborted) {
          setLoadError("Your Admin session is unavailable. Please sign in again.");
          setLoading(false);
        }
      });
    }

    return getAdminPaymentSettings(token, signal)
      .then((response) => {
        if (!signal?.aborted) {
          setSettings(response.settings);
          setValues(toForm(response.settings));
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (!signal?.aborted) {
          setLoadError(getAdminSettingsErrorMessage(error));
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
    void loadSettings(controller.signal);

    return () => controller.abort();
  }, [loadSettings]);

  const previewUrl = useMemo(
    () => (selectedQr ? URL.createObjectURL(selectedQr) : null),
    [selectedQr],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const hasChanges = Boolean(
    settings &&
      values &&
      (values.gcash_account_name !== (settings.gcash_account_name ?? "") ||
        values.gcash_number !== (settings.gcash_number ?? "") ||
        values.payment_instructions !== (settings.payment_instructions ?? "") ||
        selectedQr ||
        removeQr),
  );

  const updateField = (field: keyof SettingsForm, value: string) => {
    setValues((current) => (current ? { ...current, [field]: value } : current));
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
    setSaveError(null);
  };

  const chooseQr = (file: File | null) => {
    setFileError("");
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.qr_image;
      return next;
    });

    if (!file) {
      return;
    }

    if (!ACCEPTED_QR_TYPES.includes(file.type)) {
      setSelectedQr(null);
      setFileError("Choose a JPG, PNG, or WEBP image.");
      return;
    }

    if (file.size > MAX_QR_SIZE) {
      setSelectedQr(null);
      setFileError("The QR image must be 5 MB or smaller.");
      return;
    }

    setSelectedQr(file);
    setRemoveQr(false);
    setSaveError(null);
  };

  const saveSettings = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!values || !hasChanges || saving) {
      return;
    }

    const token = getAuthToken();

    if (!token) {
      setSaveError("Your Admin session is unavailable. Please sign in again.");
      return;
    }

    const nextErrors: FieldErrors = {};

    if (values.gcash_account_name.trim().length > 255) {
      nextErrors.gcash_account_name = ["Use 255 characters or fewer."];
    }

    if (values.gcash_number.trim().length > 30) {
      nextErrors.gcash_number = ["Use 30 characters or fewer."];
    }

    if (values.payment_instructions.trim().length > 2000) {
      nextErrors.payment_instructions = ["Use 2,000 characters or fewer."];
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    const body = new FormData();
    body.append("_method", "PATCH");
    body.append("gcash_account_name", values.gcash_account_name.trim());
    body.append("gcash_number", values.gcash_number.trim());
    body.append("payment_instructions", values.payment_instructions.trim());

    if (selectedQr) {
      body.append("qr_image", selectedQr);
    }

    if (removeQr) {
      body.append("remove_qr_image", "1");
    }

    setSaving(true);
    setSaveError(null);
    setFieldErrors({});

    try {
      const response = await saveAdminPaymentSettings(token, body);
      setSettings(response.settings);
      setValues(toForm(response.settings));
      setSelectedQr(null);
      setRemoveQr(false);
      showToast({
        title: "Payment settings saved",
        message: "Customer payment instructions now use these saved details.",
      });
    } catch (error) {
      setSaveError(getAdminSettingsErrorMessage(error));
      setFieldErrors(getAdminSettingsValidationErrors(error));
    } finally {
      setSaving(false);
    }
  };

  const imageUrl = previewUrl ?? (removeQr ? null : settings?.qr_image_url ?? null);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
          Admin Portal
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[#0B1930]">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Manage the manual online-payment details shown to customers when they
          submit payment proof.
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
              void loadSettings();
            }}
            className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-300 px-3 font-semibold hover:bg-red-100"
          >
            <FontAwesomeIcon icon={faRotate} aria-hidden="true" /> Try again
          </button>
        </section>
      ) : loading || !settings || !values ? (
        <section
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          aria-label="Loading payment settings"
          aria-live="polite"
        >
          <div className="h-6 w-48 animate-pulse rounded bg-slate-100" />
          <div className="h-11 animate-pulse rounded bg-slate-100" />
          <div className="h-11 animate-pulse rounded bg-slate-100" />
          <div className="h-28 animate-pulse rounded bg-slate-100" />
        </section>
      ) : (
        <form onSubmit={saveSettings} className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-100 p-5 sm:p-6">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange-50 text-orange-600">
                <FontAwesomeIcon icon={faCreditCard} aria-hidden="true" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold text-[#0B1930]">Manual online payment</h2>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${settings.is_configured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
                    {settings.is_configured ? "Configured" : "Not configured"}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  These public details are displayed in the customer payment
                  instructions. Do not enter private API credentials here.
                </p>
              </div>
            </div>

            <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">
              <SettingsField
                id="gcash-account-name"
                label="GCash account name"
                value={values.gcash_account_name}
                error={fieldErrors.gcash_account_name?.[0]}
                maxLength={255}
                onChange={(value) => updateField("gcash_account_name", value)}
              />
              <SettingsField
                id="gcash-number"
                label="GCash number"
                value={values.gcash_number}
                error={fieldErrors.gcash_number?.[0]}
                maxLength={30}
                inputMode="tel"
                onChange={(value) => updateField("gcash_number", value)}
              />
              <SettingsField
                id="payment-instructions"
                label="Customer instructions"
                value={values.payment_instructions}
                error={fieldErrors.payment_instructions?.[0]}
                maxLength={2000}
                rows={4}
                wide
                onChange={(value) => updateField("payment_instructions", value)}
              />

              <div className="md:col-span-2">
                <span className="text-sm font-semibold text-[#0B1930]">
                  Payment QR image
                </span>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Optional JPG, PNG, or WEBP image up to 5 MB.
                </p>
                <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="grid size-40 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt="Configured customer payment QR code"
                        className="size-full object-contain p-2"
                      />
                    ) : (
                      <div className="px-3 text-center text-xs text-slate-400">
                        <FontAwesomeIcon icon={faImage} className="mb-2 text-2xl" aria-hidden="true" />
                        <span className="block">No QR image configured</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      <FontAwesomeIcon icon={faUpload} aria-hidden="true" />
                      {selectedQr ? "Choose another image" : "Upload QR image"}
                      <input
                        className="sr-only"
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                        onChange={(event) => {
                          const input = event.currentTarget;
                          const file = input.files?.[0] ?? null;
                          input.value = "";
                          chooseQr(file);
                        }}
                        aria-describedby={
                          fileError || fieldErrors.qr_image?.[0]
                            ? "qr-image-help qr-image-error"
                            : "qr-image-help"
                        }
                      />
                    </label>
                    {settings.qr_image_url && !removeQr ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedQr(null);
                          setRemoveQr(true);
                        }}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50"
                      >
                        <FontAwesomeIcon icon={faTrashCan} aria-hidden="true" /> Remove QR
                      </button>
                    ) : null}
                  </div>
                </div>
                <span id="qr-image-help" className="sr-only">
                  Select a JPG, PNG, or WEBP image up to 5 megabytes.
                </span>
                {fileError || fieldErrors.qr_image?.[0] ? (
                  <p id="qr-image-error" className="mt-2 text-sm text-red-700" role="alert">
                    {fileError || fieldErrors.qr_image?.[0]}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          {saveError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
              {saveError}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              {settings.updated_at
                ? `Last saved ${new Date(settings.updated_at).toLocaleString("en-PH")}`
                : "Payment instructions have not been configured yet."}
            </p>
            <button
              type="submit"
              disabled={!hasChanges || saving || Boolean(fileError)}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-orange-600 px-5 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {saving ? "Saving…" : "Save Payment Settings"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function SettingsField({
  id,
  label,
  value,
  error,
  maxLength,
  inputMode,
  rows,
  wide = false,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  maxLength: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  rows?: number;
  wide?: boolean;
  onChange: (value: string) => void;
}) {
  const errorId = `${id}-error`;
  const fieldClass =
    "mt-1.5 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#0B1930] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <label htmlFor={id} className="text-sm font-semibold text-[#0B1930]">
        {label}
      </label>
      {rows ? (
        <textarea
          id={id}
          rows={rows}
          maxLength={maxLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`${fieldClass} min-h-28 resize-y`}
        />
      ) : (
        <input
          id={id}
          type="text"
          inputMode={inputMode}
          maxLength={maxLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={fieldClass}
        />
      )}
      {error ? (
        <p id={errorId} className="mt-1 text-xs font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
