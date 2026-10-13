"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChartConfiguration } from "chart.js";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getStaffReports,
  getStaffReportsErrorMessage,
} from "@/lib/staffReportsApi";
import type { StaffReportsResponse } from "@/lib/staffReportsTypes";
import PortalPagination from "@/components/staff/PortalPagination";
import { Badge } from "@/components/staff/PortalTable";
import StaffPageHeader from "@/components/staff/StaffPageHeader";
import { useAuth } from "@/components/auth/AuthProvider";
import ReportChart from "./Charts";

type Preset = "last30" | "month" | "week" | "custom";

const PAGE_SIZE = 10;
const numberFormatter = new Intl.NumberFormat("en-PH");
const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});
const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
});

const orderStatuses = [
  ["", "All order statuses"],
  ["pending", "Pending"],
  ["under_review", "Under Review"],
  ["confirmed", "Confirmed"],
  ["waiting_for_payment", "Waiting for Payment"],
  ["payment_verification", "Payment Verification"],
  ["preparing_order", "Preparing Order"],
  ["ready_for_pickup", "Ready for Pickup"],
  ["booked_for_delivery", "Booked for Delivery"],
  ["picked_up_by_rider", "Picked Up by Rider"],
  ["waiting_for_booking", "Waiting for Booking"],
  ["completed", "Completed"],
  ["rejected", "Rejected"],
  ["cancelled", "Cancelled"],
] as const;

const paymentStatuses = [
  ["", "All payment statuses"],
  ["unpaid", "Unpaid"],
  ["waiting_for_payment", "Waiting for Payment"],
  ["waiting_for_verification", "Waiting for Verification"],
  ["paid", "Paid"],
  ["failed", "Failed"],
  ["refunded", "Refunded"],
  ["cancelled", "Cancelled"],
] as const;

function dateStamp(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function rangeFor(preset: Exclude<Preset, "custom">) {
  const today = new Date();
  const from = new Date(today);

  if (preset === "month") {
    from.setDate(1);
  } else if (preset === "week") {
    from.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  } else {
    from.setDate(today.getDate() - 29);
  }

  return { from: dateStamp(from), to: dateStamp(today) };
}

function labelize(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "Not available" : dateFormatter.format(date);
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-semibold text-[#0B1930]">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  support,
}: {
  label: string;
  value: string;
  support: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-3xl font-bold tracking-tight text-[#0B1930]">{value}</p>
      <h2 className="mt-1 font-semibold text-[#0B1930]">{label}</h2>
      <p className="mt-1 text-sm text-slate-500">{support}</p>
    </article>
  );
}

function StatusList({
  title,
  entries,
}: {
  title: string;
  entries: Array<{ label: string; value: number; color?: string }>;
}) {
  const total = entries.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div>
      <h3 className="text-sm font-semibold text-[#0B1930]">{title}</h3>
      <ul className="mt-3 space-y-3">
        {entries.map((entry) => {
          const width = total
            ? Math.max((entry.value / total) * 100, entry.value ? 3 : 0)
            : 0;

          return (
            <li key={entry.label}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-slate-600">{entry.label}</span>
                <span className="font-semibold text-[#0B1930]">
                  {numberFormatter.format(entry.value)}
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-orange-500"
                  style={{
                    width: `${width}%`,
                    backgroundColor: entry.color,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ProductsTable({
  products,
}: {
  products: StaffReportsResponse["top_products"];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <caption className="sr-only">Top completed products</caption>
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Units</th>
            <th className="px-4 py-3">Orders</th>
            <th className="px-4 py-3">Recorded value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((product) => (
            <tr key={product.product_id}>
              <td className="whitespace-nowrap px-4 py-3">
                <p className="font-semibold text-[#0B1930]">{product.name}</p>
                <p className="text-xs text-slate-500">
                  {product.part_number ?? "No part number"}
                </p>
              </td>
              <td className="px-4 py-3">{numberFormatter.format(product.units_sold)}</td>
              <td className="px-4 py-3">{numberFormatter.format(product.orders)}</td>
              <td className="whitespace-nowrap px-4 py-3 font-semibold">
                {formatCurrency(product.revenue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RealReportsPage() {
  const { isLoading: isAuthLoading, user } = useAuth();
  const initialRange = rangeFor("last30");
  const [preset, setPreset] = useState<Preset>("last30");
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [draftFrom, setDraftFrom] = useState(initialRange.from);
  const [draftTo, setDraftTo] = useState(initialRange.to);
  const [fulfillment, setFulfillment] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<StaffReportsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      const token = getAuthToken();

      if (!token || user?.role !== "staff") {
        setIsLoading(false);
        setError("Your Staff session has expired. Please sign in again.");
        return;
      }

      setIsLoading(true);
      setError(null);

      void getStaffReports(token, {
        from,
        to,
        fulfillment,
        orderStatus,
        paymentStatus,
        page: currentPage,
        perPage: PAGE_SIZE,
        signal: controller.signal,
      })
        .then((nextData) => {
          setData(nextData);

          if (currentPage > nextData.meta.last_page) {
            setCurrentPage(Math.max(nextData.meta.last_page, 1));
          }
        })
        .catch((requestError: unknown) => {
          if (requestError instanceof Error && requestError.name === "AbortError") {
            return;
          }

          setError(getStaffReportsErrorMessage(requestError));
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsLoading(false);
          }
        });
    }, 0);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [
    currentPage,
    fulfillment,
    from,
    isAuthLoading,
    orderStatus,
    paymentStatus,
    reloadNonce,
    to,
    user?.role,
  ]);

  const trendChart = useMemo<ChartConfiguration | null>(() => {
    if (!data) {
      return null;
    }

    return {
      type: "line",
      data: {
        labels: data.order_trend.map((point) => point.label),
        datasets: [
          {
            label: "Order requests",
            data: data.order_trend.map((point) => point.orders),
            borderColor: "#0B1930",
            backgroundColor: "rgba(11,25,48,.08)",
            fill: true,
            tension: 0.35,
            yAxisID: "orders",
          },
          {
            label: "Collected revenue",
            data: data.order_trend.map((point) => point.completed_sales),
            borderColor: "#f97316",
            backgroundColor: "rgba(249,115,22,.08)",
            fill: true,
            tension: 0.35,
            yAxisID: "sales",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        scales: {
          orders: { beginAtZero: true, position: "left" },
          sales: {
            beginAtZero: true,
            position: "right",
            grid: { drawOnChartArea: false },
          },
        },
      },
    };
  }, [data]);

  const statusChart = useMemo<ChartConfiguration | null>(() => {
    if (!data) {
      return null;
    }

    return {
      type: "doughnut",
      data: {
        labels: data.order_statuses.map((entry) => entry.label),
        datasets: [
          {
            data: data.order_statuses.map((entry) => entry.value),
            backgroundColor: data.order_statuses.map((entry) => entry.color),
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } },
      },
    };
  }, [data]);

  const applyPreset = (nextPreset: Exclude<Preset, "custom">) => {
    const nextRange = rangeFor(nextPreset);

    setPreset(nextPreset);
    setDraftFrom(nextRange.from);
    setDraftTo(nextRange.to);
    setFrom(nextRange.from);
    setTo(nextRange.to);
    setCurrentPage(1);
  };

  const applyCustomRange = () => {
    setPreset("custom");
    setFrom(draftFrom);
    setTo(draftTo);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    const nextRange = rangeFor("last30");

    setPreset("last30");
    setDraftFrom(nextRange.from);
    setDraftTo(nextRange.to);
    setFrom(nextRange.from);
    setTo(nextRange.to);
    setFulfillment("");
    setOrderStatus("");
    setPaymentStatus("");
    setCurrentPage(1);
  };

  const hasPendingRange = draftFrom !== from || draftTo !== to;
  const orders = data?.orders ?? [];
  const noData = data?.summary.order_requests === 0;

  return (
    <div className="space-y-6">
      <StaffPageHeader
        eyebrow="Business Insights"
        title="Reports"
        description="Review real order, payment, fulfillment, and product activity for your branch."
      >
        {data ? (
          <p className="text-sm text-slate-500">
            {data.filters.branch.name} · {data.filters.from} to {data.filters.to}
          </p>
        ) : null}
      </StaffPageHeader>

      <section
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        aria-label="Report filters"
      >
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["last30", "Last 30 Days"],
              ["month", "This Month"],
              ["week", "This Week"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => applyPreset(value)}
              className={`min-h-10 rounded-lg px-3 text-sm font-semibold transition ${preset === value ? "bg-[#0B1930] text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm font-medium text-slate-700">
            From
            <input
              type="date"
              value={draftFrom}
              onChange={(event) => {
                setPreset("custom");
                setDraftFrom(event.target.value);
              }}
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            To
            <input
              type="date"
              value={draftTo}
              onChange={(event) => {
                setPreset("custom");
                setDraftTo(event.target.value);
              }}
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Fulfillment
            <select
              value={fulfillment}
              onChange={(event) => {
                setFulfillment(event.target.value);
                setCurrentPage(1);
              }}
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">All fulfillment</option>
              <option value="pickup">Store Pickup</option>
              <option value="delivery">Lalamove Delivery</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Order status
            <select
              value={orderStatus}
              onChange={(event) => {
                setOrderStatus(event.target.value);
                setCurrentPage(1);
              }}
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              {orderStatuses.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Payment status
            <select
              value={paymentStatus}
              onChange={(event) => {
                setPaymentStatus(event.target.value);
                setCurrentPage(1);
              }}
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              {paymentStatuses.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={applyCustomRange}
            disabled={!hasPendingRange || isLoading}
            className="min-h-10 rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apply date range
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Reset filters
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500" role="status" aria-live="polite">
          {hasPendingRange
            ? "Date changes are waiting to be applied. Select Apply date range to refresh the report."
            : `Report data is filtered from ${from} to ${to}.`}
        </p>
      </section>

      {isLoading ? (
        <div
          className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600"
          role="status"
          aria-live="polite"
        >
          Loading report data…
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700" role="alert">
          <p className="font-semibold">Unable to load reports</p>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={() => setReloadNonce((nonce) => nonce + 1)}
            className="mt-4 rounded-lg bg-[#0B1930] px-4 py-2 font-semibold text-white hover:bg-slate-800"
          >
            Retry
          </button>
        </div>
      ) : null}

      {data && !error ? (
        <>
          {noData ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
              No report data found for the selected filters.
            </div>
          ) : null}

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Report summary">
            <MetricCard
              label="Order Requests"
              value={numberFormatter.format(data.summary.order_requests)}
              support="All requests in the selected period"
            />
            <MetricCard
              label="Successful Orders"
              value={numberFormatter.format(data.summary.completed_orders)}
              support="Completed pickup/delivery; payment-independent"
            />
            <MetricCard
              label="In Progress"
              value={numberFormatter.format(data.summary.in_progress_orders)}
              support="Requests not yet terminal"
            />
            <MetricCard
              label="Revenue Collected"
              value={formatCurrency(data.summary.completed_sales_value)}
              support="Latest payment status: Paid"
            />
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Verified Payments"
              value={numberFormatter.format(data.summary.verified_payments)}
              support={formatCurrency(data.payments.verified_amount)}
            />
            <MetricCard
              label="Payment Attention"
              value={numberFormatter.format(data.summary.payment_attention)}
              support="Unpaid or awaiting verification"
            />
            <MetricCard
              label="Store Pickup"
              value={numberFormatter.format(data.summary.pickup_orders)}
              support="Requests in the selected period"
            />
            <MetricCard
              label="Lalamove Delivery"
              value={numberFormatter.format(data.summary.delivery_orders)}
              support="Requests in the selected period"
            />
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(20rem,1fr)]">
            <ChartCard
              title="Orders and collected revenue over time"
              description="Order requests and latest paid-payment revenue by order date."
            >
              {trendChart ? (
                <ReportChart config={trendChart} label="Orders and completed sales trend" />
              ) : null}
            </ChartCard>
            <ChartCard
              title="Orders by status"
              description="Canonical order statuses from the Laravel backend."
            >
              {statusChart ? (
                <ReportChart config={statusChart} label="Order status distribution" />
              ) : null}
            </ChartCard>
          </section>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <ChartCard title="Fulfillment mix" description="Pickup versus Lalamove requests.">
              <StatusList
                title="Requests"
                entries={data.fulfillment.map((entry) => ({
                  label: entry.label,
                  value: entry.orders,
                  color: entry.key === "delivery" ? "#6366f1" : "#0B1930",
                }))}
              />
            </ChartCard>
            <ChartCard title="Payment methods" description="Persisted payment records in this scope.">
              <StatusList title="Methods" entries={data.payments.methods} />
            </ChartCard>
            <ChartCard title="Customer mix" description="Distinct customers represented by these requests.">
              <StatusList
                title="Customers"
                entries={[
                  { label: "Registered Customers", value: data.customers.registered, color: "#0B1930" },
                  { label: "Guest Customers", value: data.customers.guests, color: "#f97316" },
                  { label: "Repeat Customers", value: data.customers.repeat_customers, color: "#16a34a" },
                ]}
              />
            </ChartCard>
          </section>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ChartCard
              title="Top successful products"
              description="Historical order-item snapshots from completed pickup/delivery fulfillment."
            >
              {data.top_products.length ? (
                <ProductsTable products={data.top_products} />
              ) : (
                <p className="text-sm text-slate-500">No successful products in this period.</p>
              )}
            </ChartCard>
            <ChartCard title="Payment status" description="Payment statuses in the selected report scope.">
              <StatusList title="Persisted payments" entries={data.payments.statuses} />
            </ChartCard>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <h2 className="font-semibold text-[#0B1930]">Report order records</h2>
              <p className="mt-1 text-sm text-slate-500">
                {numberFormatter.format(data.meta.total)} authorized order request records.
              </p>
            </div>

            {orders.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                  <caption className="sr-only">Staff report order records</caption>
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Reference</th>
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Fulfillment</th>
                      <th className="px-5 py-3 text-center">Payment</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((order) => (
                      <tr key={order.reference}>
                        <td className="whitespace-nowrap px-5 py-3.5 font-bold text-[#0B1930]">
                          {order.reference}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          <span className="block truncate font-medium text-slate-700">
                            {order.customer?.full_name ?? "Guest customer"}
                          </span>
                          <span className="block truncate text-xs text-slate-400">
                            {order.customer?.contact_number ?? "No phone"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">
                          {labelize(order.fulfillment_method)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <Badge>{labelize(order.payment_status)}</Badge>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <Badge>{labelize(order.status)}</Badge>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold text-slate-700">
                          {formatCurrency(order.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-14 text-center text-sm text-slate-500">
                No order records match these filters.
              </div>
            )}

            <PortalPagination
              currentPage={data.meta.current_page}
              totalItems={data.meta.total}
              pageSize={data.meta.per_page}
              onPageChange={setCurrentPage}
              itemLabel="order records"
            />
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-semibold text-[#0B1930]">Recent successful orders</h2>
            <p className="mt-1 text-sm text-slate-500">
              Orders with completed pickup or delivered Lalamove fulfillment; payment status does not affect this count.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <caption className="sr-only">Recent successful orders</caption>
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Reference</th>
                    <th className="px-3 py-3">Fulfillment</th>
                    <th className="px-3 py-3">Completed value</th>
                    <th className="px-3 py-3">Requested</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recent_completed_orders.map((order) => (
                    <tr key={order.reference}>
                      <td className="px-3 py-3 font-semibold text-[#0B1930]">{order.reference}</td>
                      <td className="px-3 py-3">{labelize(order.fulfillment)}</td>
                      <td className="px-3 py-3 font-semibold">{formatCurrency(order.total_amount)}</td>
                      <td className="px-3 py-3 text-slate-600">{formatDate(order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.recent_completed_orders.length ? (
                <p className="py-5 text-center text-sm text-slate-500">
                  No successful orders in this period.
                </p>
              ) : null}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
