"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxArchive,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faCircleExclamation,
  faRefresh,
  faRotateLeft,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getAdminArchive,
  getAdminArchiveErrorMessage,
  permanentlyDeleteAdminRecord,
  restoreAdminRecord,
} from "@/lib/adminArchiveApi";
import type {
  AdminArchiveRecord,
  AdminArchiveType,
} from "@/lib/adminArchiveTypes";

type PendingAction = {
  action: "restore" | "delete";
  record: AdminArchiveRecord;
};

function label(value: string | null | undefined): string {
  return value
    ? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Not available";
}

function formatDate(value: string | null): string {
  const parsed = value ? new Date(value) : null;

  return parsed && !Number.isNaN(parsed.getTime())
    ? new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(parsed)
    : "Not available";
}

function getPageNumbers(current: number, last: number): Array<number | "ellipsis"> {
  if (last <= 7) {
    return Array.from({ length: last }, (_, index) => index + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);

  if (start > 2) pages.push("ellipsis");
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < last - 1) pages.push("ellipsis");
  pages.push(last);

  return pages;
}

export default function RealAdminArchivePage() {
  const token = getAuthToken();
  const [records, setRecords] = useState<AdminArchiveRecord[]>([]);
  const [types, setTypes] = useState<AdminArchiveType[]>([]);
  const [type, setType] = useState<AdminArchiveType | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ message: string; destination: string } | null>(null);

  const loadArchive = useCallback(async (signal?: AbortSignal) => {
    if (!token) {
      setError("Your Admin session is unavailable. Please sign in again.");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await getAdminArchive(token, {
        type,
        search,
        page,
        perPage: 10,
        signal,
      });

      setRecords(response.archives);
      setTypes(response.types.map((option) => option.value));
      setLastPage(response.meta.last_page);
      setTotal(response.meta.total);
      setError(null);

      if (page > response.meta.last_page && response.meta.last_page > 0) {
        setPage(response.meta.last_page);
      }
    } catch (requestError) {
      if (requestError instanceof Error && requestError.name === "AbortError") {
        return;
      }

      setError(getAdminArchiveErrorMessage(requestError));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [page, search, token, type]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadArchive(controller.signal), 150);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadArchive]);

  const pageNumbers = useMemo(
    () => getPageNumbers(page, lastPage),
    [lastPage, page],
  );

  const confirmAction = useCallback(async () => {
    if (!token || !pending) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = pending.action === "restore"
        ? await restoreAdminRecord(token, pending.record.archive_type, pending.record.id)
        : await permanentlyDeleteAdminRecord(token, pending.record.archive_type, pending.record.id);

      setPending(null);
      setSuccess({
        message: result.message,
        destination: result.archive.destination,
      });
      await loadArchive();
    } catch (requestError) {
      setError(getAdminArchiveErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }, [loadArchive, pending, token]);

  const resetFilters = () => {
    setType("");
    setSearch("");
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">
            Record Management
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl">
            Archive
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            Temporarily remove Admin records from active lists without changing their original identity, history, relationships, or business status.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadArchive()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <FontAwesomeIcon icon={faRefresh} aria-hidden="true" />
          Refresh
        </button>
      </section>

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void loadArchive()} className="font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {success && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
          <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
          <span className="flex-1">{success.message}</span>
          <Link href={success.destination} className="font-semibold underline">
            View restored feature
          </Link>
          <button type="button" onClick={() => setSuccess(null)} className="font-semibold" aria-label="Dismiss success message">
            Dismiss
          </button>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-3xl font-bold text-[#0B1930]">{loading ? "—" : total}</p>
          <h2 className="mt-1 font-semibold text-[#0B1930]">Archived records</h2>
          <p className="mt-1 text-sm text-slate-500">Records currently hidden from active Admin lists.</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-3xl font-bold text-[#0B1930]">{loading ? "—" : types.length}</p>
          <h2 className="mt-1 font-semibold text-[#0B1930]">Supported types</h2>
          <p className="mt-1 text-sm text-slate-500">Orders, products, payments, customers, and Admin records.</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-3xl font-bold text-[#0B1930]">{loading ? "—" : "Same row"}</p>
          <h2 className="mt-1 font-semibold text-[#0B1930]">Restore behavior</h2>
          <p className="mt-1 text-sm text-slate-500">Restore changes only the archive state.</p>
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_14rem_auto]">
          <label>
            <span className="sr-only">Search archived records</span>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search archived records"
              className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-orange-500"
            />
          </label>
          <label>
            <span className="sr-only">Filter archive type</span>
            <select
              value={type}
              onChange={(event) => {
                setType(event.target.value as AdminArchiveType | "");
                setPage(1);
              }}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">All types</option>
              {types.map((value) => (
                <option key={value} value={value}>{label(value)}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={resetFilters} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-orange-600">
            Clear
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
          <div>
            <h2 className="text-lg font-semibold text-[#0B1930]">Archived records</h2>
            <p className="mt-1 text-sm text-slate-500">{total} matching record{total === 1 ? "" : "s"}</p>
          </div>
          <span className="text-sm text-slate-500">Page {page} of {lastPage}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-slate-50">
              <tr>
                {["Record", "Feature", "Business state", "Relationships", "Archived", "Action"].map((heading) => (
                  <th key={heading} scope="col" className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-14 text-center text-slate-500">Loading archived records…</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-14 text-center text-slate-500"><FontAwesomeIcon icon={faBoxArchive} className="text-2xl text-slate-300" /><p className="mt-3">No archived records found.</p></td></tr>
              ) : records.map((record) => (
                <ArchiveRow key={`${record.archive_type}-${record.id}`} record={record} onAction={setPending} />
              ))}
            </tbody>
          </table>
        </div>
        {lastPage > 1 && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-slate-500">Showing {total === 0 ? 0 : (page - 1) * 10 + 1}–{Math.min(page * 10, total)} of {total}</span>
            <nav className="flex flex-wrap items-center justify-end gap-1" aria-label="Archive pages">
              <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))} className="grid size-9 place-items-center rounded-lg border border-slate-300 text-slate-700 disabled:opacity-40" aria-label="Previous archive page"><FontAwesomeIcon icon={faChevronLeft} /></button>
              {pageNumbers.map((pageNumber, index) => pageNumber === "ellipsis" ? <span key={`ellipsis-${index}`} className="px-2 text-slate-400">…</span> : <button type="button" key={pageNumber} aria-current={pageNumber === page ? "page" : undefined} disabled={loading} onClick={() => setPage(pageNumber)} className={`min-w-9 rounded-lg border px-3 py-2 font-semibold ${pageNumber === page ? "border-orange-600 bg-orange-600 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}>{pageNumber}</button>)}
              <button type="button" disabled={page >= lastPage || loading} onClick={() => setPage((current) => Math.min(lastPage, current + 1))} className="grid size-9 place-items-center rounded-lg border border-slate-300 text-slate-700 disabled:opacity-40" aria-label="Next archive page"><FontAwesomeIcon icon={faChevronRight} /></button>
            </nav>
          </div>
        )}
      </section>

      {pending && (
        <ConfirmationDialog pending={pending} submitting={submitting} onClose={() => setPending(null)} onConfirm={() => void confirmAction()} />
      )}
    </div>
  );
}

function ArchiveRow({ record, onAction }: { record: AdminArchiveRecord; onAction: (pending: PendingAction) => void }) {
  const summary = record.record;
  const relationshipValues = summary?.relationships
    ? Object.entries(summary.relationships).map(([key, value]) => `${label(key)}: ${value}`).join(" · ")
    : "No relationship summary";

  return (
    <tr className="transition hover:bg-slate-50/80">
      <td className="px-5 py-4">
        <b className="block text-[#0B1930]">{summary?.title ?? `${record.label} #${record.id}`}</b>
        <small className="mt-1 block font-mono text-xs text-slate-500">{summary?.reference ?? `#${record.id}`}</small>
      </td>
      <td className="px-5 py-4">
        <span className="font-semibold text-[#0B1930]">{record.label}</span>
        <Link href={record.destination} className="mt-1 block text-xs font-semibold text-orange-600 hover:underline">{record.destination}</Link>
      </td>
      <td className="px-5 py-4 text-slate-600">
        <span>{label(summary?.status)}</span>
        {summary?.fulfillment_type && <small className="mt-1 block text-xs text-slate-500">{label(summary.fulfillment_type)}</small>}
      </td>
      <td className="max-w-sm px-5 py-4 text-xs leading-5 text-slate-500">{relationshipValues}</td>
      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{formatDate(record.archived_at)}</td>
      <td className="px-5 py-4">
        {record.record_exists ? (
          <div className="flex gap-2">
            <button type="button" onClick={() => onAction({ action: "restore", record })} className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"><FontAwesomeIcon icon={faRotateLeft} /> Restore</button>
            <button type="button" onClick={() => onAction({ action: "delete", record })} className="grid size-8 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50" aria-label={`Permanently delete ${summary?.title ?? record.label}`}><FontAwesomeIcon icon={faTrash} /></button>
          </div>
        ) : <span className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700"><FontAwesomeIcon icon={faCircleExclamation} /> Original row unavailable</span>}
      </td>
    </tr>
  );
}

function ConfirmationDialog({ pending, submitting, onClose, onConfirm }: { pending: PendingAction; submitting: boolean; onClose: () => void; onConfirm: () => void }) {
  const isRestore = pending.action === "restore";
  const title = pending.record.record?.title ?? `${pending.record.label} #${pending.record.id}`;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/60 p-4">
      <div role="alertdialog" aria-modal="true" aria-labelledby="archive-action-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className={`grid size-12 place-items-center rounded-full ${isRestore ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
          <FontAwesomeIcon icon={isRestore ? faRotateLeft : faTrash} />
        </div>
        <h2 id="archive-action-title" className="mt-4 text-xl font-bold text-[#0B1930]">{isRestore ? `Restore ${pending.record.label}?` : `Permanently delete ${pending.record.label}?`}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {isRestore
            ? `${title} will return to ${pending.record.destination} with its same ID, relationships, history, and business status. No replacement row or media upload will be created.`
            : `This permanently deletes ${title}. It cannot be restored afterward, and the server will protect records that still have relationships.`}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-50">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={submitting} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${isRestore ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}>{submitting ? "Working…" : isRestore ? "Restore" : "Delete permanently"}</button>
        </div>
      </div>
    </div>
  );
}
