"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRefresh } from "@fortawesome/free-solid-svg-icons";
import { AdminBadge } from "@/components/admin/AdminDataTable";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getAdminPickupRequests,
  getAdminPickupRequestsErrorMessage,
} from "@/lib/adminPickupRequestsApi";
import type {
  AdminPickupListResponse,
  AdminPickupRequest,
} from "@/lib/adminPickupRequestTypes";
import RealAdminPickupRequestDetailsModal from "./RealAdminPickupRequestDetailsModal";

const PAGE_SIZE = 10;

const tabs = [
  ["All", ""],
  ["Pending", "pending"],
  ["Preparing", "preparing"],
  ["Ready for Pickup", "ready_for_pickup"],
  ["Completed", "completed"],
  ["Cancelled", "cancelled"],
] as const;

function label(value: string | null | undefined) {
  return value
    ? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Not available";
}

function money(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value)
    : "Not available";
}

function schedule(date: string | null, time: string | null) {
  const dateLabel = date
    ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(`${date}T00:00:00`))
    : "Date not set";
  const timeLabel = time
    ? new Intl.DateTimeFormat("en-PH", { timeStyle: "short" }).format(new Date(`1970-01-01T${time}`))
    : "Time not set";

  return `${dateLabel} · ${timeLabel}`;
}

function pageNumbers(current: number, last: number): Array<number | "ellipsis"> {
  if (last <= 7) return Array.from({ length: last }, (_, index) => index + 1);
  const result: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);
  if (start > 2) result.push("ellipsis");
  for (let number = start; number <= end; number += 1) result.push(number);
  if (end < last - 1) result.push("ellipsis");
  result.push(last);
  return result;
}

export default function RealAdminPickupRequestsPage() {
  const token = getAuthToken();
  const [response, setResponse] = useState<AdminPickupListResponse | null>(null);
  const [search, setSearch] = useState("");
  const [branchId, setBranchId] = useState<number | "">("");
  const [assignedStaffId, setAssignedStaffId] = useState<number | "">("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [selectedPickupId, setSelectedPickupId] = useState<number | null>(null);

  const loadPickups = useCallback(async (signal?: AbortSignal) => {
    if (!token) {
      setError("Your Admin session is unavailable. Please sign in again.");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const nextResponse = await getAdminPickupRequests(token, {
        search,
        branchId,
        assignedStaffId,
        status,
        page,
        perPage: PAGE_SIZE,
        signal,
      });
      setResponse(nextResponse);
      setError(null);
      if (nextResponse.meta.last_page > 0 && page > nextResponse.meta.last_page) {
        setPage(nextResponse.meta.last_page);
      }
    } catch (requestError) {
      if (requestError instanceof Error && requestError.name === "AbortError") return;
      setError(getAdminPickupRequestsErrorMessage(requestError));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [assignedStaffId, branchId, page, search, status, token]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadPickups(controller.signal), 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadPickups, reloadNonce]);

  const resetFilters = () => {
    setSearch("");
    setBranchId("");
    setAssignedStaffId("");
    setStatus("");
    setPage(1);
  };

  const summary = response?.summary;
  const pickups = response?.pickup_requests ?? [];
  const meta = response?.meta;
  const filters = response?.filters;
  const numbers = useMemo(
    () => pageNumbers(page, meta?.last_page ?? 1),
    [meta?.last_page, page],
  );

  const openDetails = (pickup: AdminPickupRequest) => setSelectedPickupId(pickup.id);
  const closeDetails = useCallback(() => setSelectedPickupId(null), []);

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">Fulfillment</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl">Store Pickup Requests</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">Read-only oversight of real pickup requests across all branches. Branch staff manage pickup progress.</p>
        </div>
        <button type="button" onClick={() => setReloadNonce((nonce) => nonce + 1)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <FontAwesomeIcon icon={faRefresh} aria-hidden="true" /> Refresh
        </button>
      </section>

      {error ? <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert"><span>{error}</span><button type="button" onClick={() => setReloadNonce((nonce) => nonce + 1)} className="font-semibold underline">Retry</button></div> : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Pickup request summary">
        {[
          [summary?.active, "Active Pickups", "Pending, preparing, or ready"],
          [summary?.ready_for_pickup, "Ready for Pickup", "Awaiting customer collection"],
          [summary?.completed_today, "Completed Today", "Persisted completions today"],
          [summary?.total, "Total Requests", "All recorded store pickups"],
        ].map(([value, title, description]) => <article key={title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-3xl font-bold text-[#0B1930]">{value ?? "—"}</p><h2 className="mt-1 font-semibold text-[#0B1930]">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></article>)}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white px-4 shadow-sm sm:px-5">
        <div className="overflow-x-auto"><div className="flex min-w-max items-center gap-6" role="tablist" aria-label="Filter pickups by status">
          {tabs.map(([tabLabel, value]) => <button key={value || "all"} type="button" role="tab" aria-selected={status === value} onClick={() => { setStatus(value); setPage(1); }} className={`inline-flex min-h-14 items-center gap-2 border-b-2 px-1 text-sm font-semibold ${status === value ? "border-orange-500 text-[#0B1930]" : "border-transparent text-slate-500 hover:text-[#0B1930]"}`}>{tabLabel}<span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600">{value ? summary?.[value as keyof typeof summary] ?? "—" : summary?.total ?? "—"}</span></button>)}
        </div></div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(17rem,1fr)_repeat(2,minmax(10rem,1fr))_auto]">
          <input aria-label="Search pickup requests" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search order, customer, contact, branch, or staff" className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-orange-500" />
          <select aria-label="Branch" value={branchId} onChange={(event) => { setBranchId(event.target.value ? Number(event.target.value) : ""); setPage(1); }} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="">All branches</option>{filters?.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select>
          <select aria-label="Assigned staff" value={assignedStaffId} onChange={(event) => { setAssignedStaffId(event.target.value ? Number(event.target.value) : ""); setPage(1); }} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="">All staff</option>{filters?.staff.map((staff) => <option key={staff.id} value={staff.id}>{staff.name}</option>)}</select>
          <button type="button" onClick={resetFilters} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-orange-600">Clear filters</button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-busy={loading}>
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold text-[#0B1930]">Pickup Request List</h2><p className="mt-1 text-sm text-slate-500">{meta ? `${meta.total} matching pickup request${meta.total === 1 ? "" : "s"}` : "Loading pickup requests…"}</p></div><span className="text-sm text-slate-500">Page {meta?.current_page ?? page} of {meta?.last_page ?? 1}</span></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left"><thead className="bg-slate-50"><tr>{["Order", "Customer", "Branch", "Pickup Schedule", "Amount", "Payment", "Assigned Staff", "Status", "Action"].map((heading) => <th key={heading} scope="col" className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan={9} className="px-5 py-14 text-center text-slate-500">Loading pickup requests…</td></tr> : pickups.length === 0 ? <tr><td colSpan={9} className="px-5 py-14 text-center text-slate-500">No pickup requests match these filters.</td></tr> : pickups.map((pickup) => <tr key={pickup.id} className="transition hover:bg-slate-50/80"><td className="px-5 py-4"><b className="text-[#0B1930]">{pickup.order_reference ?? "No order reference"}</b><small className="mt-1 block text-slate-500">{label(pickup.order_status)}</small></td><td className="px-5 py-4"><b className="block text-[#0B1930]">{pickup.customer?.full_name ?? "Guest customer"}</b><small className="text-slate-500">{pickup.customer?.contact_number || pickup.customer?.email || "No contact"}</small></td><td className="px-5 py-4 text-slate-600">{pickup.branch?.name ?? "Not assigned"}</td><td className="px-5 py-4 text-slate-600">{schedule(pickup.pickup_date, pickup.pickup_time)}</td><td className="px-5 py-4 font-semibold text-[#0B1930]">{money(pickup.amount)}</td><td className="px-5 py-4"><div className="space-y-1"><AdminBadge>{label(pickup.payment?.status ?? "no payment")}</AdminBadge><small className="block text-slate-500">{label(pickup.payment?.method)}</small></div></td><td className="px-5 py-4 text-slate-600">{pickup.assigned_staff?.name ?? "Unassigned"}</td><td className="px-5 py-4"><AdminBadge>{label(pickup.pickup_status)}</AdminBadge></td><td className="px-5 py-4"><button type="button" onClick={() => openDetails(pickup)} className="min-h-9 rounded-lg border border-orange-400 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-50">View</button></td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><span className="text-slate-500">Showing {meta?.total ? (page - 1) * meta.per_page + 1 : 0}–{meta ? Math.min(page * meta.per_page, meta.total) : 0} of {meta?.total ?? 0}</span>{(meta?.last_page ?? 1) > 1 ? <nav className="flex flex-wrap items-center justify-end gap-1" aria-label="Pickup request pages"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 disabled:opacity-40">Previous</button>{numbers.map((number, index) => number === "ellipsis" ? <span key={`ellipsis-${index}`} className="px-2 text-slate-400">…</span> : <button type="button" key={number} aria-current={number === page ? "page" : undefined} disabled={loading} onClick={() => setPage(number)} className={`min-w-9 rounded-lg border px-3 py-2 font-semibold ${number === page ? "border-orange-600 bg-orange-600 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}>{number}</button>)}<button type="button" disabled={page >= (meta?.last_page ?? 1) || loading} onClick={() => setPage((current) => Math.min(meta?.last_page ?? current, current + 1))} className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 disabled:opacity-40">Next</button></nav> : null}</div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4"><h2 className="text-lg font-semibold text-[#0B1930]">Pickup Requests by Branch</h2><p className="mt-1 text-sm text-slate-500">All branch totals are based on persisted pickup records.</p></div>
        {response?.branch_summary.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{response.branch_summary.map((branch) => <article key={branch.id} className="rounded-lg border border-slate-200 p-4"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-[#0B1930]">{branch.name}</h3><span className="text-sm font-bold text-slate-700">{branch.total} total</span></div><p className="mt-2 text-sm text-slate-600">{branch.active} active · {branch.completed} completed</p></article>)}</div> : <p className="text-sm text-slate-500">No branch pickup records found.</p>}
      </section>

      <RealAdminPickupRequestDetailsModal key={selectedPickupId ?? "closed"} pickupId={selectedPickupId} onClose={closeDetails} />
    </div>
  );
}
