"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { faEye, faFlag } from "@fortawesome/free-solid-svg-icons";
import { getAuthToken } from "@/lib/auth/authStorage";
import { getManagedReviews, getReviewErrorMessage, moderateReview, type ProductReview } from "@/lib/reviews/reviewApi";
import ActionButton from "@/components/staff/ActionButton";
import PortalTable, { Badge, type Column } from "@/components/staff/PortalTable";
import StaffPageHeader from "@/components/staff/StaffPageHeader";
import Summary from "@/components/staff/Summary";
import ReviewRating from "@/components/staff/reviews/ReviewRating";

function statusLabel(status?: ProductReview["status"]) {
  return status === "pending_review" ? "Pending Review" : status === "flagged" ? "Flagged" : status === "hidden" ? "Hidden" : "Published";
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(date);
}

export default function AdminReviewsPage() {
  const [records, setRecords] = useState<ProductReview[]>([]);
  const [summary, setSummary] = useState({ total: 0, average_rating: 0, pending_review: 0, flagged: 0 });
  const [selected, setSelected] = useState<ProductReview | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadReviews = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setError("Your Admin session has expired. Please sign in again.");
      setIsLoading(false);
      return;
    }
    try {
      const response = await getManagedReviews("admin", token);
      setRecords(response.reviews);
      setSummary(response.summary);
      setError("");
    } catch (loadError) {
      setError(getReviewErrorMessage(loadError, "Reviews could not be loaded."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadReviews(), 0);
    return () => window.clearTimeout(timer);
  }, [loadReviews]);

  const action = async (review: ProductReview, nextAction: "publish" | "hide" | "restore" | "resolve-flag") => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const response = await moderateReview(token, review.id, nextAction);
      setSelected(response.review);
      await loadReviews();
    } catch (actionError) {
      setError(getReviewErrorMessage(actionError, "The moderation action could not be completed."));
    }
  };

  const columns: Column<ProductReview>[] = useMemo(() => [
    { label: "Customer", render: (row) => <b className="text-[#0B1930]">{row.customer.name}</b>, search: (row) => row.customer.name },
    { label: "Product", render: (row) => row.product?.name ?? "Product", search: (row) => row.product?.name ?? "" },
    { label: "Rating", render: (row) => <ReviewRating rating={row.rating} /> },
    { label: "Review", render: (row) => <span className="block max-w-60 truncate">{row.review_text}</span>, search: (row) => row.review_text },
    { label: "Branch", render: (row) => row.branch ?? "—", search: (row) => row.branch ?? "" },
    { label: "Status", render: (row) => <Badge>{statusLabel(row.status)}</Badge>, search: (row) => statusLabel(row.status) },
    { label: "Date", render: (row) => formatDate(row.created_at) },
    { label: "Action", render: (row) => <ActionButton label="View Review" icon={row.status === "flagged" ? faFlag : faEye} onClick={() => setSelected(row)} /> },
  ], []);

  return (
    <div className="space-y-5">
      <StaffPageHeader eyebrow="Review Moderation" title="Customer Reviews" description="Review, publish, hide, restore, and resolve customer feedback." />
      <Summary items={[[String(summary.total), "Total Reviews", "All customer reviews"], [summary.average_rating.toFixed(1), "Average Rating", "Published reviews"], [String(summary.pending_review), "Pending Review", "Waiting for moderation"], [String(summary.flagged), "Flagged", "Needs Admin attention"]]} />
      {error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p> : null}
      <PortalTable title="Review List" description={isLoading ? "Loading reviews…" : `${records.length} customer reviews`} rows={records} columns={columns} tabs={["All", "Published", "Pending Review", "Flagged", "Hidden"]} tabValue={(row, tab) => statusLabel(row.status) === tab} />
      {selected ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="admin-review-title">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">Review Details</p><h2 id="admin-review-title" className="mt-1 text-xl font-bold text-[#0B1930]">{selected.customer.name}</h2><p className="mt-1 text-sm text-slate-500">{selected.product?.name ?? "Product"}</p></div><button type="button" onClick={() => setSelected(null)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">Close</button></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase text-slate-400">Rating</p><ReviewRating rating={selected.rating} showValue /></div><div><p className="text-xs font-semibold uppercase text-slate-400">Status</p><Badge>{statusLabel(selected.status)}</Badge></div><div><p className="text-xs font-semibold uppercase text-slate-400">Purchase</p><p className="mt-1 text-sm text-slate-700">{selected.verified_purchase ? "Verified purchase" : "Unverified"}{selected.order_reference ? ` · ${selected.order_reference}` : ""}</p></div><div><p className="text-xs font-semibold uppercase text-slate-400">Submitted</p><p className="mt-1 text-sm text-slate-700">{formatDate(selected.created_at)}</p></div></div>
            <blockquote className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">{selected.review_text}</blockquote>
            {selected.response ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-slate-700"><strong className="block text-emerald-800">Staff response</strong>{selected.response.text}</div> : null}
            {selected.flag_reason ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><strong className="block">Flag reason</strong>{selected.flag_reason}</div> : null}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              {selected.status === "pending_review" || selected.status === "flagged" ? <button type="button" onClick={() => void action(selected, "publish")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Publish</button> : null}
              {selected.status === "flagged" ? <button type="button" onClick={() => void action(selected, "resolve-flag")} className="rounded-lg border border-orange-300 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50">Resolve Flag</button> : null}
              {selected.status !== "hidden" ? <button type="button" onClick={() => void action(selected, "hide")} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Hide</button> : <button type="button" onClick={() => void action(selected, "restore")} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">Restore</button>}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
