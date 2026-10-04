"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { getAuthToken } from "@/lib/auth/authStorage";
import { toStatusLabel } from "@/lib/orders/orderAdapter";
import ActionButton from "@/components/staff/ActionButton";
import PortalPagination from "@/components/staff/PortalPagination";
import { Badge } from "@/components/staff/PortalTable";
import StaffPageHeader from "@/components/staff/StaffPageHeader";
import Summary from "@/components/staff/Summary";
import {
  getStaffPickups,
  getStaffPickupsErrorMessage,
} from "./staffPickupApi";
import type {
  StaffPickupDetails,
  StaffPickupRequest,
  StaffPickupsResponse,
} from "./staffPickupTypes";
import RealStaffPickupDetailsModal from "./RealStaffPickupDetailsModal";

const PAGE_SIZE = 8;

const statusTabs = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Preparing", value: "preparing" },
  { label: "Ready for Pickup", value: "ready_for_pickup" },
  { label: "Completed", value: "completed" },
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

function customerLabel(pickup: StaffPickupRequest) {
  return pickup.customer?.full_name ?? "Guest customer";
}

function paymentLabel(pickup: StaffPickupRequest) {
  return pickup.payment ? toStatusLabel(pickup.payment.status) : "No payment";
}

function updateSummary(
  response: StaffPickupsResponse,
  previousStatus: string,
  nextStatus: string,
): StaffPickupsResponse["summary"] {
  const summary = { ...response.summary };
  const statusKeys = [
    "pending",
    "preparing",
    "ready_for_pickup",
    "completed",
    "cancelled",
  ] as const;

  if (statusKeys.includes(previousStatus as (typeof statusKeys)[number])) {
    const status = previousStatus as (typeof statusKeys)[number];
    summary[status] = Math.max(0, summary[status] - 1);
  }

  if (statusKeys.includes(nextStatus as (typeof statusKeys)[number])) {
    const status = nextStatus as (typeof statusKeys)[number];
    summary[status] += 1;
  }

  if (previousStatus !== nextStatus) {
    const activeStatuses = ["pending", "preparing", "ready_for_pickup"];
    const wasActive = activeStatuses.includes(previousStatus);
    const isActive = activeStatuses.includes(nextStatus);

    if (wasActive && !isActive) {
      summary.active = Math.max(0, summary.active - 1);
    }

    if (!wasActive && isActive) {
      summary.active += 1;
    }
  }

  return summary;
}

export default function RealPickupRequestsPage() {
  const { isLoading: isAuthLoading, user } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [response, setResponse] = useState<StaffPickupsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [selectedPickupId, setSelectedPickupId] = useState<number | null>(null);

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
        const nextResponse = await getStaffPickups(token, {
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
          getStaffPickupsErrorMessage(
            requestError,
            "Staff pickup requests could not be loaded. Please try again.",
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

  const handlePickupUpdated = useCallback(
    (updatedPickup: StaffPickupDetails) => {
      setResponse((currentResponse) => {
        if (!currentResponse) {
          return currentResponse;
        }

        const previousPickup = currentResponse.pickup_requests.find(
          (pickup) => pickup.id === updatedPickup.id,
        );

        return {
          ...currentResponse,
          pickup_requests: currentResponse.pickup_requests.map((pickup) =>
            pickup.id === updatedPickup.id ? updatedPickup : pickup,
          ),
          summary: previousPickup
            ? updateSummary(
                currentResponse,
                previousPickup.pickup_status,
                updatedPickup.pickup_status,
              )
            : currentResponse.summary,
        };
      });
      setReloadNonce((value) => value + 1);
    },
    [],
  );

  const summaryItems = useMemo(() => {
    const summary = response?.summary;

    return [
      [String(summary?.total ?? "—"), "Pickup Requests", "All branch requests"],
      [String(summary?.active ?? "—"), "Active Pickups", "Pending, preparing, or ready"],
      [String(summary?.ready_for_pickup ?? "—"), "Ready for Pickup", "Awaiting customer collection"],
      [String(summary?.completed ?? "—"), "Completed", "Collected by customers"],
    ] as [string, string, string][];
  }, [response?.summary]);

  const pickups = response?.pickup_requests ?? [];
  const hasFilters = Boolean(searchInput.trim() || status);

  return (
    <div className="space-y-5">
      <StaffPageHeader
        eyebrow="Fulfillment"
        title="Pickup Requests"
        description="Prepare real branch pickup orders and confirm customer collection."
      />

      <Summary items={summaryItems} />

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5">
          <div className="flex min-w-max gap-6 overflow-x-auto">
            {statusTabs.map((tab) => (
              <button
                key={tab.value || "all"}
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

        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-[#0B1930]">
              Pickup Requests
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {response ? `${response.meta.total} matching requests` : "Loading branch requests"}
            </p>
          </div>
          <label className="relative block w-full sm:w-80">
            <span className="sr-only">Search pickup requests</span>
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="pointer-events-none absolute left-3 top-3 text-slate-400"
              aria-hidden="true"
            />
            <input
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search order or customer"
              className="min-h-10 w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </label>
        </div>

        {isLoading ? (
          <div className="space-y-3 px-6 py-8" aria-live="polite" aria-busy="true">
            <div className="h-12 animate-pulse rounded bg-slate-100" />
            <div className="h-12 animate-pulse rounded bg-slate-100" />
            <div className="h-12 animate-pulse rounded bg-slate-100" />
            <span className="sr-only">Loading pickup requests</span>
          </div>
        ) : error ? (
          <div className="px-6 py-16 text-center" role="alert">
            <p className="font-semibold text-[#0B1930]">Unable to load pickup requests</p>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <button
              type="button"
              onClick={() => setReloadNonce((value) => value + 1)}
              className="mt-5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Retry
            </button>
          </div>
        ) : pickups.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[980px] border-collapse text-left">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      "Order",
                      "Customer",
                      "Branch",
                      "Items",
                      "Amount",
                      "Payment",
                      "Status",
                      "Updated",
                      "Action",
                    ].map((label) => (
                      <th
                        key={label}
                        className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                        scope="col"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pickups.map((pickup) => (
                    <tr key={pickup.id} className="transition hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-5 py-3.5 text-sm font-bold text-[#0B1930]">
                        {pickup.order_reference ?? "No reference"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-600">
                        {customerLabel(pickup)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-600">
                        {pickup.branch?.name ?? "Not available"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-600">
                        {pickup.item_count}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-slate-700">
                        {formatCurrency(pickup.amount)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-600">
                        <Badge>{paymentLabel(pickup)}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-600">
                        <Badge>{toStatusLabel(pickup.pickup_status)}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-500">
                        {formatDate(pickup.updated_at)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-sm">
                        <ActionButton
                          label="View Pickup"
                          onClick={() => setSelectedPickupId(pickup.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-200 md:hidden">
              {pickups.map((pickup) => (
                <article key={pickup.id} className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-[#0B1930]">
                        {pickup.order_reference ?? "No reference"}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {customerLabel(pickup)}
                      </p>
                    </div>
                    <Badge>{toStatusLabel(pickup.pickup_status)}</Badge>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-400">Branch</dt>
                      <dd className="mt-1 text-slate-600">{pickup.branch?.name ?? "Not available"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-400">Amount</dt>
                      <dd className="mt-1 font-semibold text-slate-700">{formatCurrency(pickup.amount)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-400">Payment</dt>
                      <dd className="mt-1 text-slate-600">{paymentLabel(pickup)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-400">Items</dt>
                      <dd className="mt-1 text-slate-600">{pickup.item_count}</dd>
                    </div>
                  </dl>
                  <ActionButton
                    label="View Pickup"
                    onClick={() => setSelectedPickupId(pickup.id)}
                  />
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="font-semibold text-[#0B1930]">
              {hasFilters ? "No pickup requests found" : "No persisted pickup requests yet"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {hasFilters
                ? "Try changing your search or selected status."
                : "Customer Store Pickup orders will appear here when they are created."}
            </p>
          </div>
        )}

        {response && !error ? (
          <PortalPagination
            currentPage={response.meta.current_page}
            totalItems={response.meta.total}
            pageSize={response.meta.per_page}
            onPageChange={setCurrentPage}
            itemLabel="pickup requests"
          />
        ) : null}
      </section>

      <RealStaffPickupDetailsModal
        isOpen={selectedPickupId !== null}
        pickupId={selectedPickupId}
        onClose={() => setSelectedPickupId(null)}
        onUpdated={handlePickupUpdated}
      />
    </div>
  );
}
