"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpRightFromSquare,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faEye,
  faFileImage,
  faRefresh,
  faRotate,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  deleteAdminMediaAsset,
  getAdminMedia,
  getAdminMediaAsset,
  getAdminMediaErrorMessage,
  retryAdminMediaCleanup,
} from "@/lib/adminMediaApi";
import type {
  AdminMediaAsset,
  AdminMediaPurpose,
  AdminMediaResponse,
  AdminMediaStatus,
} from "@/lib/adminMediaTypes";
import MediaActionDialog from "./MediaActionDialog";
import MediaDetailsModal from "./MediaDetailsModal";
import { formatDate, label, statusClasses } from "./mediaUtils";

type PendingAction = {
  action: "delete" | "retry";
  media: AdminMediaAsset;
};

function pageNumbers(current: number, last: number): Array<number | "ellipsis"> {
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

function MediaStatus({ media }: { media: AdminMediaAsset }) {
  return (
    <span className={"inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset " + statusClasses(media.status)}>
      {media.status_label || label(media.status)}
    </span>
  );
}

export default function RealAdminMediaPage() {
  const token = getAuthToken();
  const [response, setResponse] = useState<AdminMediaResponse | null>(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<AdminMediaPurpose | "">("");
  const [status, setStatus] = useState<AdminMediaStatus | "">("");
  const [sort, setSort] = useState<"newest" | "oldest" | "status" | "type">("newest");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<AdminMediaAsset | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const loadMedia = useCallback(async (signal?: AbortSignal) => {
    if (!token) {
      setError("Your Admin session is unavailable. Please sign in again.");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const nextResponse = await getAdminMedia(token, {
        search,
        type,
        status,
        sort,
        page,
        perPage: 10,
        signal,
      });

      setResponse(nextResponse);
      setError(null);

      if (page > nextResponse.meta.last_page && nextResponse.meta.last_page > 0) {
        setPage(nextResponse.meta.last_page);
      }
    } catch (requestError) {
      if (requestError instanceof Error && requestError.name === "AbortError") {
        return;
      }

      setError(getAdminMediaErrorMessage(requestError));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [page, search, sort, status, token, type]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadMedia(controller.signal), 150);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadMedia, reloadNonce]);

  const openDetails = useCallback(async (media: AdminMediaAsset) => {
    setSelectedMedia(media);
    setDetailsLoading(true);

    try {
      const details = await getAdminMediaAsset(getAuthToken() ?? "", media.id);
      setSelectedMedia(details);
    } catch {
      setSelectedMedia(media);
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const confirmAction = useCallback(async () => {
    if (!token || !pending) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = pending.action === "delete"
        ? await deleteAdminMediaAsset(token, pending.media.id)
        : await retryAdminMediaCleanup(token, pending.media.id);

      setPending(null);
      setSuccess(result.message);
      setSelectedMedia(null);
      setReloadNonce((nonce) => nonce + 1);
    } catch (requestError) {
      setError(getAdminMediaErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }, [pending, token]);

  const resetFilters = () => {
    setSearch("");
    setType("");
    setStatus("");
    setSort("newest");
    setPage(1);
  };

  const meta = response?.meta;
  const media = response?.media ?? [];
  const pageList = useMemo(
    () => pageNumbers(page, meta?.last_page ?? 1),
    [meta?.last_page, page],
  );
  const summary = response?.summary;
  const types = response?.types ?? [];
  const statuses = response?.statuses ?? [];

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">Content Operations</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl">Media &amp; Uploads</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
            Review Cloudinary-backed uploads, their linked ALD records, and cleanup history from one Admin registry.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSuccess(null);
            setReloadNonce((nonce) => nonce + 1);
          }}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <FontAwesomeIcon icon={faRefresh} aria-hidden="true" />
          Refresh
        </button>
      </section>

      {error ? (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setReloadNonce((nonce) => nonce + 1)} className="font-semibold underline">
            Retry
          </button>
        </div>
      ) : null}

      {success ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
          <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
          <span className="flex-1">{success}</span>
          <button type="button" onClick={() => setSuccess(null)} className="font-semibold" aria-label="Dismiss success message">
            Dismiss
          </button>
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [summary?.active, "Active assets", "Currently linked to ALD records"],
          [summary?.orphaned, "Orphaned assets", "No current business record"],
          [summary?.cleanup_failed, "Cleanup issues", "Cloudinary cleanup needs retry"],
          [summary?.deleted, "Deleted history", "Registry history retained"],
        ].map(([value, title, description]) => (
          <article key={title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-3xl font-bold text-[#0B1930]">{loading ? "—" : value ?? 0}</p>
            <h2 className="mt-1 font-semibold text-[#0B1930]">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(17rem,1fr)_repeat(3,minmax(10rem,1fr))_auto]">
          <label className="relative block">
            <span className="sr-only">Search media assets</span>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search filename, public ID, product, payment"
              className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-orange-500"
            />
          </label>
          <label>
            <span className="sr-only">Filter media purpose</span>
            <select
              value={type}
              onChange={(event) => {
                setType(event.target.value as AdminMediaPurpose | "");
                setPage(1);
              }}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">All purposes</option>
              {types.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter media status</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as AdminMediaStatus | "");
                setPage(1);
              }}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">All statuses</option>
              {statuses.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Sort media</span>
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as typeof sort);
                setPage(1);
              }}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="status">Status</option>
              <option value="type">Purpose</option>
            </select>
          </label>
          <button type="button" onClick={resetFilters} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-orange-600">
            Clear
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#0B1930]">Registered uploads</h2>
            <p className="mt-1 text-sm text-slate-500">
              {meta?.total ?? 0} total registry record{meta?.total === 1 ? "" : "s"}.
            </p>
          </div>
          <p className="text-sm text-slate-500">Product images, payment proofs, and inquiry attachments</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1160px] border-collapse text-left">
            <thead className="bg-slate-50">
              <tr>
                {["Preview", "Asset", "Purpose", "Linked record", "Status", "Uploaded by", "Uploaded at", "Actions"].map((heading) => (
                  <th key={heading} scope="col" className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-14 text-center text-slate-500">Loading media registry...</td></tr>
              ) : media.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center">
                    <FontAwesomeIcon icon={faFileImage} className="text-2xl text-slate-300" aria-hidden="true" />
                    <p className="mt-3 font-semibold text-[#0B1930]">No media assets found</p>
                    <p className="mt-1 text-sm text-slate-500">Try clearing the filters or upload a file through an existing ALD workflow.</p>
                  </td>
                </tr>
              ) : (
                media.map((asset) => (
                  <tr key={asset.id} className="transition hover:bg-slate-50/80">
                    <td className="px-5 py-4">
                      <button type="button" onClick={() => void openDetails(asset)} className="block overflow-hidden rounded-lg border border-slate-200 bg-slate-50" aria-label={"View " + (asset.original_filename ?? "media asset")}>
                        <img src={asset.secure_url} alt="" className="size-14 object-cover" />
                      </button>
                    </td>
                    <td className="max-w-[240px] px-5 py-4">
                      <button type="button" onClick={() => void openDetails(asset)} className="text-left">
                        <span className="block truncate font-semibold text-[#0B1930] hover:text-orange-600">{asset.original_filename ?? "Unnamed asset"}</span>
                        <span className="mt-1 block truncate text-xs text-slate-500">{asset.cloudinary_public_id ?? "No public ID"}</span>
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{asset.purpose_label || label(asset.purpose)}</td>
                    <td className="max-w-[230px] px-5 py-4">
                      {asset.linked_record ? (
                        <div>
                          {asset.linked_record.destination && asset.linked_record.exists ? (
                            <Link href={asset.linked_record.destination} className="block truncate font-semibold text-[#0B1930] hover:text-orange-600">
                              {asset.linked_record.title}
                            </Link>
                          ) : (
                            <span className="block truncate font-semibold text-slate-600">{asset.linked_record.title}</span>
                          )}
                          <span className="mt-1 block truncate text-xs text-slate-500">{label(asset.linked_record.type)} #{asset.linked_record.id}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">Not linked</span>
                      )}
                    </td>
                    <td className="px-5 py-4"><MediaStatus media={asset} /></td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{asset.uploaded_by?.name ?? "System / legacy import"}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{formatDate(asset.uploaded_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => void openDetails(asset)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                          <FontAwesomeIcon icon={faEye} aria-hidden="true" />
                          View
                        </button>
                        {asset.can_delete ? (
                          <button type="button" onClick={() => setPending({ action: "delete", media: asset })} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50">
                            <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
                            Delete
                          </button>
                        ) : null}
                        {asset.can_retry_cleanup ? (
                          <button type="button" onClick={() => setPending({ action: "retry", media: asset })} className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-50">
                            <FontAwesomeIcon icon={faRotate} aria-hidden="true" />
                            Retry
                          </button>
                        ) : null}
                        <a href={asset.secure_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50" aria-label="Open asset">
                          <FontAwesomeIcon icon={faArrowUpRightFromSquare} aria-hidden="true" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-slate-500">
            Showing {meta?.total ? (page - 1) * (meta?.per_page ?? 10) + 1 : 0}–{meta ? Math.min(page * meta.per_page, meta.total) : 0} of {meta?.total ?? 0}
          </span>
          {(meta?.last_page ?? 1) > 1 ? (
            <nav className="flex flex-wrap items-center justify-end gap-1" aria-label="Media pages">
              <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 disabled:opacity-40">
                <FontAwesomeIcon icon={faChevronLeft} aria-hidden="true" /> <span className="sr-only">Previous</span>
              </button>
              {pageList.map((number, index) => number === "ellipsis" ? (
                <span key={"ellipsis-" + index} className="px-2 text-slate-400">…</span>
              ) : (
                <button type="button" key={number} aria-current={number === page ? "page" : undefined} disabled={loading} onClick={() => setPage(number)} className={"min-w-9 rounded-lg border px-3 py-2 font-semibold " + (number === page ? "border-orange-600 bg-orange-600 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50")}>
                  {number}
                </button>
              ))}
              <button type="button" disabled={page >= (meta?.last_page ?? 1) || loading} onClick={() => setPage((current) => Math.min(meta?.last_page ?? current, current + 1))} className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 disabled:opacity-40">
                <FontAwesomeIcon icon={faChevronRight} aria-hidden="true" /> <span className="sr-only">Next</span>
              </button>
            </nav>
          ) : null}
        </div>
      </section>

      {detailsLoading ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/20" aria-live="polite">
          <div className="rounded-lg bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-xl">Loading media details...</div>
        </div>
      ) : null}
      <MediaDetailsModal media={selectedMedia} onClose={() => setSelectedMedia(null)} />
      <MediaActionDialog
        media={pending?.media ?? null}
        action={pending?.action ?? "delete"}
        submitting={submitting}
        onCancel={() => setPending(null)}
        onConfirm={() => void confirmAction()}
      />
    </div>
  );
}
