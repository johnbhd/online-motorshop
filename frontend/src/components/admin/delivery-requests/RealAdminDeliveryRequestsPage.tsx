"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRefresh } from "@fortawesome/free-solid-svg-icons";
import { AdminBadge } from "@/components/admin/AdminDataTable";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getAdminDeliveryRequests,
  getAdminDeliveryRequestsErrorMessage,
} from "@/lib/adminDeliveryRequestsApi";
import type {
  AdminDeliveryRequest,
  AdminDeliveryRequestListResponse,
} from "@/lib/adminDeliveryRequestTypes";
import RealAdminDeliveryRequestDetailsModal from "./RealAdminDeliveryRequestDetailsModal";

const PAGE_SIZE = 10;

const tabs = [
  ["All", ""],
  ["Waiting for Booking", "waiting_for_booking"],
  ["Booked", "booked"],
  ["Picked Up", "picked_up"],
  ["In Transit", "in_transit"],
  ["Delivered", "delivered"],
  ["Failed", "failed"],
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

function deliveryFee(value: number | null | undefined) {
  return typeof value === "number" && value > 0 ? money(value) : "Not confirmed";
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

function RequestStatus({ status }: { status: string }) {
  return <AdminBadge>{label(status)}</AdminBadge>;
}

function DeliveryCard({
  delivery,
  onView,
}: {
  delivery: AdminDeliveryRequest;
  onView: (id: number) => void;
}) {
  return (
    <article className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-[#0B1930]">{delivery.order_reference ?? "No order reference"}</h3>
          <p className="mt-1 text-sm text-slate-500">{delivery.customer?.full_name ?? "Guest customer"}</p>
        </div>
        <RequestStatus status={delivery.delivery_status} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div><dt className="text-slate-500">Destination</dt><dd className="mt-1 break-words text-slate-800">{delivery.delivery_address}</dd></div>
        <div><dt className="text-slate-500">Branch</dt><dd className="mt-1 text-slate-800">{delivery.branch?.name ?? "Not assigned"}</dd></div>
        <div><dt className="text-slate-500">Order Total</dt><dd className="mt-1 font-semibold text-[#0B1930]">{money(delivery.amount)}</dd></div>
        <div><dt className="text-slate-500">Delivery Fee</dt><dd className="mt-1 text-slate-800">{deliveryFee(delivery.delivery_fee)}</dd></div>
        <div><dt className="text-slate-500">Payment</dt><dd className="mt-1 text-slate-800">{label(delivery.payment?.status ?? "no payment")}</dd></div>
        <div><dt className="text-slate-500">Assigned Staff</dt><dd className="mt-1 text-slate-800">{delivery.assigned_staff?.name ?? "Unassigned"}</dd></div>
      </dl>
      <button type="button" onClick={() => onView(delivery.id)} className="mt-4 min-h-10 w-full rounded-lg border border-orange-400 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600">View details</button>
    </article>
  );
}

export default function RealAdminDeliveryRequestsPage() {
  const token = getAuthToken();
  const [response, setResponse] = useState<AdminDeliveryRequestListResponse | null>(null);
  const [search, setSearch] = useState("");
  const [branchId, setBranchId] = useState<number | "">("");
  const [assignedStaffId, setAssignedStaffId] = useState<number | "">("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(null);

  const loadDeliveries = useCallback(async (signal?: AbortSignal) => {
    if (!token) {
      setError("Your Admin session is unavailable. Please sign in again.");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const nextResponse = await getAdminDeliveryRequests(token, {
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
      setError(getAdminDeliveryRequestsErrorMessage(requestError));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [assignedStaffId, branchId, page, search, status, token]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadDeliveries(controller.signal), 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadDeliveries, reloadNonce]);

  const resetFilters = () => {
    setSearch("");
    setBranchId("");
    setAssignedStaffId("");
    setStatus("");
    setPage(1);
  };

  const summary = response?.summary;
  const deliveries = response?.delivery_requests ?? [];
  const meta = response?.meta;
  const filters = response?.filters;
  const numbers = useMemo(
    () => pageNumbers(page, meta?.last_page ?? 1),
    [meta?.last_page, page],
  );

  const openDetails = (id: number) => setSelectedDeliveryId(id);
  const closeDetails = useCallback(() => setSelectedDeliveryId(null), []);

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">Fulfillment</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl">Lalamove Delivery Requests</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">Read-only oversight of persisted delivery requests across all branches. Branch Staff record manual booking details and manage delivery progress.</p>
        </div>
        <button type="button" onClick={() => setReloadNonce((nonce) => nonce + 1)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <FontAwesomeIcon icon={faRefresh} aria-hidden="true" /> Refresh
        </button>
      </section>

      {error ? <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert"><span>{error}</span><button type="button" onClick={() => setReloadNonce((nonce) => nonce + 1)} className="font-semibold underline">Retry</button></div> : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Delivery request summary">
        {[
          [summary?.active, "Active Deliveries", "Booking or in transit"],
          [summary?.waiting_for_booking, "Waiting for Booking", "Awaiting Staff update"],
          [summary?.delivered_today, "Delivered Today", "Persisted completions today"],
          [summary?.total, "Total Requests", "All recorded delivery requests"],
        ].map(([value, title, description]) => <article key={title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-3xl font-bold text-[#0B1930]">{value ?? "—"}</p><h2 className="mt-1 font-semibold text-[#0B1930]">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></article>)}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white px-4 shadow-sm sm:px-5">
        <div className="overflow-x-auto"><div className="flex min-w-max items-center gap-6" role="group" aria-label="Filter delivery requests by status">
          {tabs.map(([tabLabel, value]) => <button key={value || "all"} type="button" aria-pressed={status === value} onClick={() => { setStatus(value); setPage(1); }} className={`inline-flex min-h-14 items-center gap-2 border-b-2 px-1 text-sm font-semibold ${status === value ? "border-orange-500 text-[#0B1930]" : "border-transparent text-slate-500 hover:text-[#0B1930]"}`}>{tabLabel}<span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600">{value ? summary?.[value as keyof typeof summary] ?? "—" : summary?.total ?? "—"}</span></button>)}
        </div></div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(17rem,1fr)_repeat(2,minmax(10rem,1fr))_auto]">
          <input aria-label="Search delivery requests" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search order, customer, contact, address, booking, or staff" className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-orange-500" />
          <select aria-label="Branch" value={branchId} onChange={(event) => { setBranchId(event.target.value ? Number(event.target.value) : ""); setPage(1); }} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="">All branches</option>{filters?.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select>
          <select aria-label="Assigned staff" value={assignedStaffId} onChange={(event) => { setAssignedStaffId(event.target.value ? Number(event.target.value) : ""); setPage(1); }} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="">All staff</option>{filters?.staff.map((staff) => <option key={staff.id} value={staff.id}>{staff.name}</option>)}</select>
          <button type="button" onClick={resetFilters} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-orange-600">Clear filters</button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-busy={loading}>
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold text-[#0B1930]">Delivery Request List</h2><p className="mt-1 text-sm text-slate-500">{meta ? `${meta.total} matching delivery request${meta.total === 1 ? "" : "s"}` : "Loading delivery requests…"}</p></div><span className="text-sm text-slate-500">Page {meta?.current_page ?? page} of {meta?.last_page ?? 1}</span></div>
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[1250px] border-collapse text-left"><thead className="bg-slate-50"><tr>{["Order", "Customer", "Destination", "Branch", "Amount", "Delivery Fee", "Payment", "Assigned Staff", "Status", "Action"].map((heading) => <th key={heading} scope="col" className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan={10} className="px-5 py-14 text-center text-slate-500">Loading delivery requests…</td></tr> : deliveries.length === 0 ? <tr><td colSpan={10} className="px-5 py-14 text-center text-slate-500">No delivery requests match these filters.</td></tr> : deliveries.map((delivery) => <tr key={delivery.id} className="transition hover:bg-slate-50/80"><td className="px-5 py-4"><b className="text-[#0B1930]">{delivery.order_reference ?? "No order reference"}</b><small className="mt-1 block text-slate-500">{label(delivery.order_status)}</small></td><td className="px-5 py-4"><b className="block text-[#0B1930]">{delivery.customer?.full_name ?? "Guest customer"}</b><small className="text-slate-500">{delivery.customer?.contact_number || delivery.customer?.email || "No contact"}</small></td><td className="max-w-64 truncate px-5 py-4 text-slate-600" title={delivery.delivery_address}>{delivery.delivery_address}</td><td className="px-5 py-4 text-slate-600">{delivery.branch?.name ?? "Not assigned"}</td><td className="px-5 py-4 font-semibold text-[#0B1930]">{money(delivery.amount)}</td><td className="px-5 py-4 text-slate-600">{deliveryFee(delivery.delivery_fee)}</td><td className="px-5 py-4"><div className="space-y-1"><AdminBadge>{label(delivery.payment?.status ?? "no payment")}</AdminBadge><small className="block text-slate-500">{label(delivery.payment?.method)}</small></div></td><td className="px-5 py-4 text-slate-600">{delivery.assigned_staff?.name ?? "Unassigned"}</td><td className="px-5 py-4"><RequestStatus status={delivery.delivery_status} /></td><td className="px-5 py-4"><button type="button" onClick={() => openDetails(delivery.id)} className="min-h-9 rounded-lg border border-orange-400 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-50">View</button></td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 p-4 lg:hidden">
          {loading ? <p className="py-10 text-center text-sm text-slate-500" role="status">Loading delivery requests…</p> : deliveries.length === 0 ? <p className="py-10 text-center text-sm text-slate-500">No delivery requests match these filters.</p> : deliveries.map((delivery) => <DeliveryCard key={delivery.id} delivery={delivery} onView={openDetails} />)}
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><span className="text-slate-500">Showing {meta?.total ? (page - 1) * meta.per_page + 1 : 0}–{meta ? Math.min(page * meta.per_page, meta.total) : 0} of {meta?.total ?? 0}</span>{(meta?.last_page ?? 1) > 1 ? <nav className="flex flex-wrap items-center justify-end gap-1" aria-label="Delivery request pages"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 disabled:opacity-40">Previous</button>{numbers.map((number, index) => number === "ellipsis" ? <span key={`ellipsis-${index}`} className="px-2 text-slate-400">…</span> : <button type="button" key={number} aria-current={number === page ? "page" : undefined} disabled={loading} onClick={() => setPage(number)} className={`min-w-9 rounded-lg border px-3 py-2 font-semibold ${number === page ? "border-orange-600 bg-orange-600 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}>{number}</button>)}<button type="button" disabled={page >= (meta?.last_page ?? 1) || loading} onClick={() => setPage((current) => Math.min(meta?.last_page ?? current, current + 1))} className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 disabled:opacity-40">Next</button></nav> : null}</div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4"><h2 className="text-lg font-semibold text-[#0B1930]">Delivery Requests by Branch</h2><p className="mt-1 text-sm text-slate-500">Branch totals are based on persisted delivery records; Staff manage delivery progress.</p></div>
        {response?.branch_summary.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{response.branch_summary.map((branch) => <article key={branch.id} className="rounded-lg border border-slate-200 p-4"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-[#0B1930]">{branch.name}</h3><span className="text-sm font-bold text-slate-700">{branch.total} total</span></div><p className="mt-2 text-sm text-slate-600">{branch.active} active · {branch.delivered} delivered</p></article>)}</div> : <p className="text-sm text-slate-500">No branch delivery records found.</p>}
      </section>

      <RealAdminDeliveryRequestDetailsModal key={selectedDeliveryId ?? "closed"} deliveryId={selectedDeliveryId} onClose={closeDetails} />
    </div>
  );
}
