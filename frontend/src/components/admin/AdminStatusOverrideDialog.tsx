"use client";

import { useEffect, useState } from "react";

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AdminStatusOverrideDialog({
  open,
  title,
  currentStatus,
  targetStatus,
  description = "This correction is recorded in the Admin audit history and may update the customer-facing status.",
  error,
  isSubmitting,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  currentStatus: string;
  targetStatus: string;
  description?: string;
  error?: string | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isSubmitting, onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl" role="alertdialog" aria-modal="true" aria-labelledby="admin-status-override-title">
        <h2 id="admin-status-override-title" className="text-lg font-bold text-[#0B1930]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 text-sm">
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current</dt><dd className="mt-1 font-semibold text-[#0B1930]">{label(currentStatus)}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Change to</dt><dd className="mt-1 font-semibold text-orange-700">{label(targetStatus)}</dd></div>
        </dl>
        <label className="mt-4 block text-sm font-semibold text-slate-700">Reason <span className="text-red-600">*</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} disabled={isSubmitting} placeholder="Explain why this correction is needed." className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:opacity-60" /></label>
        {error ? <p className="mt-3 text-sm text-red-700" role="alert">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-3"><button type="button" disabled={isSubmitting} onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button><button type="button" disabled={isSubmitting || reason.trim().length < 3} onClick={() => onConfirm(reason.trim())} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? "Saving..." : "Confirm correction"}</button></div>
      </div>
    </div>
  );
}
