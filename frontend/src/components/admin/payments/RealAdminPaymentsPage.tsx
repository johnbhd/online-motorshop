"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRefresh } from "@fortawesome/free-solid-svg-icons";
import { AdminBadge } from "@/components/admin/AdminDataTable";
import ArchiveRecordButton from "@/components/admin/archive/ArchiveRecordButton";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getAdminPayments,
  getAdminPaymentsErrorMessage,
} from "@/lib/adminPaymentsApi";
import type { AdminPaymentDetails, AdminPaymentListResponse } from "@/lib/adminPaymentTypes";
import RealAdminPaymentDetailsModal from "./RealAdminPaymentDetailsModal";

const tabs = [
  ["All", ""],
  ["Waiting for Verification", "waiting_for_verification"],
  ["Paid", "paid"],
  ["Unpaid", "unpaid"],
  ["Failed", "failed"],
  ["Refunded", "refunded"],
  ["Cancelled", "cancelled"],
] as const;

function label(value: string | null | undefined) {
  return value
    ? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Not available";
}

function money(value: number | null | undefined) {
  return typeof value === "number"
    ? new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value)
    : "Not available";
}

function date(value: string | null | undefined) {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime())
    ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(parsed)
    : "Not available";
}

function pageNumbers(current: number, last: number): Array<number | "ellipsis"> {
  if (last <= 7) return Array.from({ length: last }, (_, index) => index + 1);
  const result: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);
  if (start > 2) result.push("ellipsis");
  for (let value = start; value <= end; value += 1) result.push(value);
  if (end < last - 1) result.push("ellipsis");
  result.push(last);
  return result;
}

export default function RealAdminPaymentsPage() {
  const token = getAuthToken();
  const [response, setResponse] = useState<AdminPaymentListResponse | null>(null);
  const [search, setSearch] = useState("");
  const [branchId, setBranchId] = useState<number | "">("");
  const [method, setMethod] = useState("");
  const [status, setStatus] = useState("");
  const [fulfillment, setFulfillment] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);

  const loadPayments = useCallback(async (signal?: AbortSignal) => {
    if (!token) {
      setError("Your Admin session is unavailable. Please sign in again.");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const nextResponse = await getAdminPayments(token, {
        search,
        branchId,
        method,
        status,
        fulfillment,
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
      if (requestError instanceof Error && requestError.name === "AbortError") return;
      setError(getAdminPaymentsErrorMessage(requestError));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [branchId, fulfillment, method, page, search, status, token]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadPayments(controller.signal), 150);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadPayments, reloadNonce]);

  const updateListItem = useCallback((updated: AdminPaymentDetails) => {
    setResponse((current) => current ? {
      ...current,
      payments: current.payments.map((payment) => payment.id === updated.id ? updated : payment),
    } : current);
    setReloadNonce((nonce) => nonce + 1);
  }, []);

  const resetFilters = () => {
    setSearch("");
    setBranchId("");
    setMethod("");
    setStatus("");
    setFulfillment("");
    setPage(1);
  };

  const summary = response?.summary;
  const payments = response?.payments ?? [];
  const meta = response?.meta;
  const filterOptions = response?.filters;
  const numbers = useMemo(() => pageNumbers(page, meta?.last_page ?? 1), [meta?.last_page, page]);

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">Payment Management</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl">Customer Payments</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">Oversee canonical customer payment records across every ALD branch.</p>
        </div>
        <button type="button" onClick={() => { setReloadNonce((nonce) => nonce + 1); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <FontAwesomeIcon icon={faRefresh} aria-hidden="true" /> Refresh
        </button>
      </section>

      {error ? <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert"><span>{error}</span><button type="button" onClick={() => setReloadNonce((nonce) => nonce + 1)} className="font-semibold underline">Retry</button></div> : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          [summary?.total, "Payment Records", "All persisted payments"],
          [summary?.waiting_for_verification, "Needs Verification", "Waiting for staff or admin review"],
          [summary?.paid, "Paid", "Verified payments"],
          [summary?.unpaid, "Unpaid", "Pay at Pickup or awaiting payment"],
          [summary?.failed, "Failed", "Review attempts marked failed"],
        ].map(([value, title, description]) => <article key={title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-3xl font-bold text-[#0B1930]">{value ?? "—"}</p><h2 className="mt-1 font-semibold text-[#0B1930]">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></article>)}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white px-4 shadow-sm sm:px-5">
        <div className="overflow-x-auto"><div className="flex min-w-max items-center gap-6" role="tablist">
          {tabs.map(([tabLabel, tabValue]) => <button key={tabValue || "all"} type="button" role="tab" aria-selected={status === tabValue} onClick={() => { setStatus(tabValue); setPage(1); }} className={`inline-flex min-h-14 items-center gap-2 border-b-2 border-transparent px-1 text-sm font-semibold ${status === tabValue ? "border-orange-500 text-[#0B1930]" : "text-slate-500 hover:text-[#0B1930]"}`}>{tabLabel}<span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600">{tabValue ? summary?.[tabValue as keyof typeof summary] ?? "—" : summary?.total ?? "—"}</span></button>)}
        </div></div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(17rem,1fr)_repeat(4,minmax(8rem,1fr))_auto]">
          <input aria-label="Search payments" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search order, customer, phone, reference" className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-orange-500" />
          <select aria-label="Branch" value={branchId} onChange={(event) => { setBranchId(event.target.value ? Number(event.target.value) : ""); setPage(1); }} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="">All branches</option>{filterOptions?.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select>
          <select aria-label="Payment method" value={method} onChange={(event) => { setMethod(event.target.value); setPage(1); }} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="">All methods</option>{filterOptions?.methods.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select>
          <select aria-label="Fulfillment" value={fulfillment} onChange={(event) => { setFulfillment(event.target.value); setPage(1); }} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="">All fulfillment</option><option value="pickup">Store pickup</option><option value="delivery">Lalamove delivery</option></select>
          <select aria-label="Payment status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="">All statuses</option>{filterOptions?.statuses.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select>
          <button type="button" onClick={resetFilters} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-orange-600">Clear</button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5"><div><h2 className="text-lg font-semibold text-[#0B1930]">Payment Records</h2><p className="mt-1 text-sm text-slate-500">{meta ? `${meta.total} matching persisted payment record${meta.total === 1 ? "" : "s"}` : "Loading payment records..."}</p></div><span className="text-sm text-slate-500">Page {meta?.current_page ?? page} of {meta?.last_page ?? 1}</span></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1360px] border-collapse text-left"><thead className="bg-slate-50"><tr>{["Order", "Customer", "Branch", "Amount", "Method", "Status", "Submitted", "Reviewed by", "Action"].map((heading) => <th key={heading} scope="col" className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan={9} className="px-5 py-14 text-center text-slate-500">Loading payment records...</td></tr> : payments.length === 0 ? <tr><td colSpan={9} className="px-5 py-14 text-center text-slate-500">No payments found.</td></tr> : payments.map((payment) => <tr key={payment.id} className="transition hover:bg-slate-50/80"><td className="px-5 py-4"><b className="text-[#0B1930]">{payment.order_reference ?? "No order reference"}</b><small className="mt-1 block text-slate-500">{payment.reference || "No payment reference"}</small></td><td className="px-5 py-4"><b className="block text-[#0B1930]">{payment.customer?.full_name ?? "Guest customer"}</b><small className="text-slate-500">{payment.customer?.contact_number || payment.customer?.email || "No contact"}</small></td><td className="px-5 py-4 text-slate-600">{payment.branch?.name ?? "Not assigned"}</td><td className="px-5 py-4 font-semibold text-[#0B1930]">{money(payment.amount)}</td><td className="px-5 py-4 text-slate-600">{label(payment.method)}</td><td className="px-5 py-4"><AdminBadge>{label(payment.status)}</AdminBadge></td><td className="px-5 py-4 text-slate-600">{date(payment.created_at)}</td><td className="px-5 py-4 text-slate-600">{payment.verified_by?.name ?? "Not reviewed"}</td><td className="px-5 py-4"><div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => setSelectedPaymentId(payment.id)} className="rounded-lg border border-orange-400 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50">{payment.status === "waiting_for_verification" ? "Review" : "View"}</button><ArchiveRecordButton type="payment" id={payment.id} label={payment.reference || `Payment #${payment.id}`} onArchived={() => void loadPayments()} /></div></td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><span className="text-slate-500">Showing {meta?.total ? (page - 1) * meta.per_page + 1 : 0}–{meta ? Math.min(page * meta.per_page, meta.total) : 0} of {meta?.total ?? 0}</span>{(meta?.last_page ?? 1) > 1 ? <nav className="flex flex-wrap items-center justify-end gap-1" aria-label="Payment pages"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 disabled:opacity-40">Previous</button>{numbers.map((number, index) => number === "ellipsis" ? <span key={`ellipsis-${index}`} className="px-2 text-slate-400">…</span> : <button type="button" key={number} aria-current={number === page ? "page" : undefined} disabled={loading} onClick={() => setPage(number)} className={`min-w-9 rounded-lg border px-3 py-2 font-semibold ${number === page ? "border-orange-600 bg-orange-600 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}>{number}</button>)}<button type="button" disabled={page >= (meta?.last_page ?? 1) || loading} onClick={() => setPage((current) => Math.min(meta?.last_page ?? current, current + 1))} className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 disabled:opacity-40">Next</button></nav> : null}</div>
      </section>

      <RealAdminPaymentDetailsModal key={selectedPaymentId ?? "closed"} paymentId={selectedPaymentId} onClose={() => setSelectedPaymentId(null)} onUpdated={updateListItem} />
    </div>
  );
}
