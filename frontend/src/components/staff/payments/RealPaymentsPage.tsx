"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { getAuthToken } from "@/lib/auth/authStorage";
import { toStatusLabel } from "@/lib/orders/orderAdapter";
import { getPaymentMethodLabel } from "@/lib/orders/orderRequestTypes";
import ActionButton from "@/components/staff/ActionButton";
import PortalPagination from "@/components/staff/PortalPagination";
import { Badge } from "@/components/staff/PortalTable";
import StaffPageHeader from "@/components/staff/StaffPageHeader";
import Summary from "@/components/staff/Summary";
import {
  getStaffPayments,
  getStaffPaymentsErrorMessage,
} from "./staffPaymentsApi";
import type {
  StaffPayment,
  StaffPaymentDetails,
  StaffPaymentsResponse,
} from "./staffPaymentsTypes";
import RealStaffPaymentDetailsModal from "./RealStaffPaymentDetailsModal";

const PAGE_SIZE = 10;

const statusTabs = [
  { label: "All", value: "" },
  { label: "Waiting for Verification", value: "waiting_for_verification" },
  { label: "Paid", value: "paid" },
  { label: "Failed", value: "failed" },
  { label: "Unpaid", value: "unpaid" },
  { label: "Waiting for Payment", value: "waiting_for_payment" },
  { label: "Refunded", value: "refunded" },
  { label: "Cancelled", value: "cancelled" },
];

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
});

const summaryStatusKeys = [
  "unpaid",
  "waiting_for_payment",
  "waiting_for_verification",
  "paid",
  "failed",
  "refunded",
  "cancelled",
] as const;

function formatCurrency(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? currencyFormatter.format(value)
    : "Not available";
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "Not available" : dateFormatter.format(date);
}

function customerLabel(payment: StaffPayment) {
  return payment.customer?.full_name ?? "Guest customer";
}

function updateSummary(
  response: StaffPaymentsResponse,
  previousStatus: string,
  nextStatus: string,
): StaffPaymentsResponse["summary"] {
  const summary = { ...response.summary };

  if (summaryStatusKeys.includes(previousStatus as (typeof summaryStatusKeys)[number])) {
    const status = previousStatus as (typeof summaryStatusKeys)[number];
    summary[status] = Math.max(0, summary[status] - 1);
  }

  if (summaryStatusKeys.includes(nextStatus as (typeof summaryStatusKeys)[number])) {
    const status = nextStatus as (typeof summaryStatusKeys)[number];
    summary[status] += 1;
  }

  return summary;
}

export default function RealPaymentsPage() {
  const { isLoading: isAuthLoading, user } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [response, setResponse] = useState<StaffPaymentsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthLoading || user?.role !== "staff") {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      const token = getAuthToken();

      if (!token) {
        setIsLoading(false);
        setError("Your Staff session has expired. Please sign in again.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const nextResponse = await getStaffPayments(token, {
          search: searchInput,
          status,
          page: currentPage,
          perPage: PAGE_SIZE,
          signal: controller.signal,
        });

        setResponse(nextResponse);

        if (
          nextResponse.meta.last_page > 0 &&
          currentPage > nextResponse.meta.last_page
        ) {
          setCurrentPage(nextResponse.meta.last_page);
        }
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }

        setError(
          getStaffPaymentsErrorMessage(
            requestError,
            "Staff payments could not be loaded. Please try again.",
          ),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [
    currentPage,
    isAuthLoading,
    reloadNonce,
    searchInput,
    status,
    user?.role,
  ]);

  const handlePaymentUpdated = useCallback((updatedPayment: StaffPaymentDetails) => {
    setResponse((currentResponse) => {
      if (!currentResponse) {
        return currentResponse;
      }

      const previousPayment = currentResponse.payments.find(
        (payment) => payment.id === updatedPayment.id,
      );
      const remainsInCurrentFilter =
        !status || status === updatedPayment.status;

      return {
        ...currentResponse,
        payments: currentResponse.payments.flatMap((payment) => {
          if (payment.id !== updatedPayment.id) {
            return [payment];
          }

          return remainsInCurrentFilter ? [updatedPayment] : [];
        }),
        meta: remainsInCurrentFilter
          ? currentResponse.meta
          : {
              ...currentResponse.meta,
              total: Math.max(0, currentResponse.meta.total - 1),
            },
        summary: previousPayment
          ? updateSummary(
              currentResponse,
              previousPayment.status,
              updatedPayment.status,
            )
          : currentResponse.summary,
      };
    });
  }, [status]);

  const summaryItems = useMemo(() => {
    const summary = response?.summary;

    return [
      [String(summary?.total ?? "—"), "Total Payments", "Persisted payments in your branch"],
      [String(summary?.waiting_for_verification ?? "—"), "Waiting for Verification", "Payments ready for review"],
      [String(summary?.paid ?? "—"), "Paid", "Verified persisted payments"],
      [String(summary?.failed ?? "—"), "Failed", "Payment reviews marked failed"],
    ] as [string, string, string][];
  }, [response?.summary]);

  const payments = response?.payments ?? [];
  const description = response
    ? `${response.meta.total} persisted payment record${response.meta.total === 1 ? "" : "s"}`
    : "Real persisted payment records";
  const hasFilters = Boolean(searchInput.trim() || status);

  return (
    <div className="space-y-5">
      <StaffPageHeader
        eyebrow="Payment Management"
        title="Payments"
        description="Review persisted payment records for your branch."
      />

      <Summary items={summaryItems} />

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5">
          <div className="flex min-w-max gap-6 overflow-x-auto">
            {statusTabs.map((tab) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => {
                  setStatus(tab.value);
                  setCurrentPage(1);
                }}
                className={`min-h-14 border-b-2 text-sm font-semibold ${status === tab.value ? "border-orange-500 text-[#0B1930]" : "border-transparent text-slate-500 hover:text-[#0B1930]"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#0B1930]">Payment List</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>

          <label className="relative block w-full min-w-0 sm:w-[26rem]">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400" aria-hidden="true">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="h-3.5 w-3.5" />
            </span>
            <span className="sr-only">Search Staff payments</span>
            <input
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search order, customer, phone, reference"
              className="h-10 w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </label>
        </div>

        {error ? (
          <div className="px-6 py-14 text-center" role="alert">
            <p className="font-semibold text-[#0B1930]">Unable to load payments</p>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <button
              type="button"
              onClick={() => setReloadNonce((nonce) => nonce + 1)}
              className="mt-5 rounded-lg bg-[#0B1930] px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div className="space-y-3 px-6 py-8" aria-live="polite" aria-busy="true">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-lg bg-slate-100" />
            ))}
            <span className="sr-only">Loading Staff payments</span>
          </div>
        ) : payments.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1120px] table-fixed border-collapse text-left">
                <colgroup>
                  <col className="w-[170px]" />
                  <col className="w-[205px]" />
                  <col className="w-[135px]" />
                  <col className="w-[170px]" />
                  <col className="w-[185px]" />
                  <col className="w-[170px]" />
                  <col className="w-[130px]" />
                </colgroup>
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500" scope="col">Order</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500" scope="col">Customer</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500" scope="col">Amount</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500" scope="col">Method</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500" scope="col">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500" scope="col">Submitted</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500" scope="col">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="transition hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-5 py-3.5 align-middle text-sm font-bold text-[#0B1930]">{payment.order_reference ?? "No order reference"}</td>
                      <td className="px-5 py-3.5 align-middle text-sm text-slate-600">
                        <span className="block truncate font-medium text-slate-700">{customerLabel(payment)}</span>
                        <span className="block truncate text-xs text-slate-400">{payment.customer?.contact_number ?? "No phone"}</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right align-middle text-sm font-semibold text-slate-700">{formatCurrency(payment.amount)}</td>
                      <td className="px-5 py-3.5 align-middle text-sm text-slate-600"><span className="block truncate">{getPaymentMethodLabel(payment.method)}</span></td>
                      <td className="px-5 py-3.5 text-center align-middle text-sm text-slate-600"><span className="flex justify-center"><Badge>{toStatusLabel(payment.status)}</Badge></span></td>
                      <td className="whitespace-nowrap px-5 py-3.5 align-middle text-sm text-slate-600">{formatDate(payment.created_at)}</td>
                      <td className="px-5 py-3.5 text-right align-middle text-sm text-slate-600">
                        <span className="flex justify-end"><ActionButton label="View Payment" onClick={() => setSelectedPaymentId(payment.id)} /></span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-200 md:hidden">
              {payments.map((payment) => (
                <article key={payment.id} className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-[#0B1930]">{payment.order_reference ?? "No order reference"}</p>
                      <p className="mt-1 text-sm text-slate-600">{customerLabel(payment)}</p>
                    </div>
                    <Badge>{toStatusLabel(payment.status)}</Badge>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div><dt className="text-xs uppercase tracking-wide text-slate-400">Amount</dt><dd className="mt-1 font-semibold text-slate-700">{formatCurrency(payment.amount)}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-slate-400">Method</dt><dd className="mt-1 text-slate-600">{getPaymentMethodLabel(payment.method)}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-slate-400">Submitted</dt><dd className="mt-1 text-slate-600">{formatDate(payment.created_at)}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-slate-400">Reference</dt><dd className="mt-1 text-slate-600">{payment.reference ?? "Not available"}</dd></div>
                  </dl>
                  <ActionButton label="View Payment" onClick={() => setSelectedPaymentId(payment.id)} />
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="font-semibold text-[#0B1930]">
              {hasFilters ? "No payments found" : "No persisted payments yet"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {hasFilters
                ? "Try changing your search or selected status."
                : "Orders without a Payment record are not fabricated into this list."}
            </p>
          </div>
        )}

        {response && !error ? (
          <PortalPagination
            currentPage={response.meta.current_page}
            totalItems={response.meta.total}
            pageSize={response.meta.per_page}
            onPageChange={setCurrentPage}
            itemLabel="payments"
          />
        ) : null}
      </section>

      <RealStaffPaymentDetailsModal
        isOpen={selectedPaymentId !== null}
        paymentId={selectedPaymentId}
        onClose={() => setSelectedPaymentId(null)}
        onUpdated={handlePaymentUpdated}
      />
    </div>
  );
}
