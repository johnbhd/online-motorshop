"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import ActionButton from "@/components/staff/ActionButton";
import PortalPagination from "@/components/staff/PortalPagination";
import { Badge } from "@/components/staff/PortalTable";
import StaffPageHeader from "@/components/staff/StaffPageHeader";
import Summary from "@/components/staff/Summary";
import { useAuth } from "@/components/auth/AuthProvider";
import { getAuthToken } from "@/lib/auth/authStorage";
import { toStatusLabel } from "@/lib/orders/orderAdapter";
import { getStaffOrders, getStaffOrdersErrorMessage } from "./staffOrdersApi";
import type {
  StaffOrderDetails,
  StaffOrderSummary,
  StaffOrdersResponse,
} from "./staffOrdersTypes";
import RealStaffOrderDetailsModal from "./RealStaffOrderDetailsModal";

const PAGE_SIZE = 10;

const statusTabs = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Under Review", value: "under_review" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Rejected", value: "rejected" },
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

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not available"
    : dateFormatter.format(date);
}

function fulfillmentLabel(value: string) {
  return value.toLowerCase() === "delivery"
    ? "Lalamove Delivery"
    : "Store Pickup";
}

function customerLabel(order: StaffOrderSummary) {
  return order.customer?.full_name ?? "Guest customer";
}

export default function OrdersPage() {
  const { isLoading: isAuthLoading, user } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("");
  const [fulfillment, setFulfillment] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [response, setResponse] = useState<StaffOrdersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [selectedReference, setSelectedReference] = useState<string | null>(
    null,
  );
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

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
        const nextResponse = await getStaffOrders(token, {
          search: searchInput,
          status,
          fulfillment,
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
          getStaffOrdersErrorMessage(
            requestError,
            "Staff orders could not be loaded. Please try again.",
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
    fulfillment,
    isAuthLoading,
    reloadNonce,
    searchInput,
    status,
    user?.role,
  ]);

  const handleViewOrder = useCallback((order: StaffOrderSummary) => {
    setSelectedReference(order.reference);
    setIsOrderModalOpen(true);
  }, []);

  const handleCloseOrder = useCallback(() => {
    setIsOrderModalOpen(false);
    setSelectedReference(null);
  }, []);

  const handleStatusUpdated = useCallback((updatedOrder: StaffOrderDetails) => {
    setResponse((currentResponse) => {
      if (!currentResponse) {
        return currentResponse;
      }

      const previousOrder = currentResponse.orders.find(
        (order) => order.reference === updatedOrder.reference,
      );
      const nextSummary = { ...currentResponse.summary };

      for (const statusKey of [
        "pending",
        "under_review",
        "confirmed",
        "completed",
      ] as const) {
        if (previousOrder?.status === statusKey) {
          nextSummary[statusKey] = Math.max(0, nextSummary[statusKey] - 1);
        }

        if (updatedOrder.status === statusKey) {
          nextSummary[statusKey] += 1;
        }
      }

      return {
        ...currentResponse,
        orders: currentResponse.orders.map((order) =>
          order.reference === updatedOrder.reference
            ? {
                ...order,
                status: updatedOrder.status,
                updated_at: updatedOrder.updated_at,
              }
            : order,
        ),
        summary: nextSummary,
      };
    });
  }, []);

  const summaryItems = useMemo(() => {
    const summary = response?.summary;

    return [
      [String(summary?.total ?? "—"), "Total Orders", "Orders in your branch"],
      [String(summary?.pending ?? "—"), "Pending Orders", "Awaiting staff review"],
      [String(summary?.confirmed ?? "—"), "Confirmed Orders", "Accepted order requests"],
      [String(summary?.completed ?? "—"), "Completed", "Completed order requests"],
    ] as [string, string, string][];
  }, [response?.summary]);

  const orders = response?.orders ?? [];
  const description = response
    ? `${response.meta.total} customer order request${response.meta.total === 1 ? "" : "s"}`
    : "Real customer order requests";

  return (
    <div className="space-y-5">
      <StaffPageHeader
        eyebrow="Order Management"
        title="Orders"
        description="Review real customer order requests for your branch."
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
            <h2 className="text-lg font-semibold text-[#0B1930]">Order List</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center lg:max-w-[34rem]">
            <label className="relative block min-w-0 flex-1 sm:w-[22rem] sm:flex-none">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400" aria-hidden="true">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="h-3.5 w-3.5" />
              </span>
              <span className="sr-only">Search Staff orders</span>
              <input
                value={searchInput}
                onChange={(event) => {
                  setSearchInput(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search reference, customer, phone"
                className="h-10 w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </label>

            <label className="sr-only" htmlFor="staff-order-fulfillment">
              Filter by fulfillment
            </label>
            <select
              id="staff-order-fulfillment"
              value={fulfillment}
              onChange={(event) => {
                setFulfillment(event.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 sm:w-[11rem]"
            >
              <option value="">All fulfillment</option>
              <option value="pickup">Store pickup</option>
              <option value="delivery">Lalamove delivery</option>
            </select>
          </div>
        </div>

        {error ? (
          <div className="px-6 py-14 text-center" role="alert">
            <p className="font-semibold text-[#0B1930]">Unable to load orders</p>
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
            <span className="sr-only">Loading Staff orders</span>
          </div>
        ) : orders.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1280px] table-fixed border-collapse text-left">
                <colgroup>
                  <col className="w-[155px]" />
                  <col className="w-[205px]" />
                  <col className="w-[180px]" />
                  <col className="w-[125px]" />
                  <col className="w-[175px]" />
                  <col className="w-[145px]" />
                  <col className="w-[160px]" />
                  <col className="w-[135px]" />
                </colgroup>
                <thead className="bg-slate-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Reference
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Customer
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Amount
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Fulfillment
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Payment
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order.reference} className="transition hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-5 py-3.5 align-middle text-sm font-bold text-[#0B1930]">
                        {order.reference}
                      </td>
                      <td className="px-5 py-3.5 align-middle text-sm text-slate-600">
                        <span className="block truncate font-medium text-slate-700">{customerLabel(order)}</span>
                        <span className="block truncate text-xs text-slate-400">{order.customer?.contact_number ?? "No phone"}</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 align-middle text-sm text-slate-600">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right align-middle text-sm font-semibold text-slate-700">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 align-middle text-sm text-slate-600">
                        {fulfillmentLabel(order.fulfillment_method)}
                      </td>
                      <td className="px-5 py-3.5 text-center align-middle text-sm text-slate-600">
                        <span className="flex justify-center">
                          <Badge>{toStatusLabel(order.payment_status)}</Badge>
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center align-middle text-sm text-slate-600">
                        <span className="flex justify-center">
                          <Badge>{toStatusLabel(order.status)}</Badge>
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right align-middle text-sm text-slate-600">
                        <span className="flex justify-end">
                          <ActionButton
                            label="Review Order"
                            onClick={() => handleViewOrder(order)}
                          />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-200 md:hidden">
              {orders.map((order) => (
                <article key={order.reference} className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-[#0B1930]">{order.reference}</p>
                      <p className="mt-1 text-sm text-slate-600">{customerLabel(order)}</p>
                    </div>
                    <Badge>{toStatusLabel(order.status)}</Badge>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-400">Amount</dt>
                      <dd className="mt-1 font-semibold text-slate-700">{formatCurrency(order.total_amount)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-400">Fulfillment</dt>
                      <dd className="mt-1 text-slate-600">{fulfillmentLabel(order.fulfillment_method)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-400">Payment</dt>
                      <dd className="mt-1 text-slate-600">{toStatusLabel(order.payment_status)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-400">Created</dt>
                      <dd className="mt-1 text-slate-600">{formatDate(order.created_at)}</dd>
                    </div>
                  </dl>
                  <ActionButton
                    label="Review Order"
                    onClick={() => handleViewOrder(order)}
                  />
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="font-semibold text-[#0B1930]">No orders found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or selected filters.
            </p>
          </div>
        )}

        {response && !error ? (
          <PortalPagination
            currentPage={response.meta.current_page}
            totalItems={response.meta.total}
            pageSize={response.meta.per_page}
            onPageChange={setCurrentPage}
            itemLabel="orders"
          />
        ) : null}
      </section>

      <RealStaffOrderDetailsModal
        reference={selectedReference}
        isOpen={isOrderModalOpen}
        onClose={handleCloseOrder}
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  );
}
