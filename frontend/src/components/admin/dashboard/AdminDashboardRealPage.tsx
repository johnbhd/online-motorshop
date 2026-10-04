"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowRight,
  faBoxOpen,
  faCalendarDays,
  faClipboardList,
  faComments,
  faCreditCard,
  faLocationDot,
  faRefresh,
  faTruck,
  faUserGear,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { AdminBadge } from "@/components/admin/AdminDataTable";
import { formatPeso } from "@/components/user/cart/cartData";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getAdminDashboard,
  getAdminDashboardErrorMessage,
} from "@/lib/adminDashboardApi";
import type {
  AdminDashboardRecentOrder,
  AdminDashboardResponse,
  AdminDashboardSummary,
} from "@/lib/adminDashboardTypes";

type DashboardMetricDefinition = {
  key: keyof Pick<
    AdminDashboardSummary,
    "total_orders" | "payments_attention" | "active_fulfillment" | "conversations"
  >;
  label: string;
  description: (summary: AdminDashboardSummary) => string;
  href: string;
  icon: IconDefinition;
  tone: string;
};

type DashboardListRow = {
  title: string;
  detail: string;
  action?: string;
  href?: string;
  icon: IconDefinition;
};

const metricDefinitions: DashboardMetricDefinition[] = [
  {
    key: "total_orders",
    label: "Total Order Requests",
    description: (summary) => `${summary.pending_orders} pending review`,
    href: "/admin/orders",
    icon: faClipboardList,
    tone: "bg-orange-50 text-orange-600",
  },
  {
    key: "payments_attention",
    label: "Payments to Verify",
    description: () => "Waiting for verification",
    href: "/admin/payments",
    icon: faCreditCard,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    key: "active_fulfillment",
    label: "Active Fulfillment",
    description: (summary) =>
      `${summary.pickups_attention} pickup · ${summary.deliveries_attention} delivery`,
    href: "/admin/pickup-requests",
    icon: faTruck,
    tone: "bg-blue-50 text-blue-700",
  },
  {
    key: "conversations",
    label: "Customer Conversations",
    description: () => "Open conversations awaiting reply",
    href: "/admin/messages",
    icon: faComments,
    tone: "bg-orange-50 text-orange-600",
  },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (signal?: AbortSignal) => {
    const token = getAuthToken();

    if (!token) {
      setDashboard(null);
      setError("Your Admin session has expired. Please sign in again.");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await getAdminDashboard(token, signal);

      setDashboard(response);
      setError(null);
    } catch (loadError) {
      if (loadError instanceof Error && loadError.name === "AbortError") {
        return;
      }

      setDashboard(null);
      setError(getAdminDashboardErrorMessage(loadError));
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadTimeout = window.setTimeout(
      () => void loadDashboard(controller.signal),
      0,
    );

    return () => {
      window.clearTimeout(loadTimeout);
      controller.abort();
    };
  }, [loadDashboard]);

  const adminName = user?.name ?? "Admin";

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl">
            Good day, {adminName}
          </h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Here&apos;s a system-wide overview of ALD Motorshop operations.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="text-sm font-medium text-slate-500">
            <FontAwesomeIcon icon={faCalendarDays} aria-hidden="true" />{" "}
            {formatDate(new Date())}
          </p>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-[#0B1930] hover:border-orange-400 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faRefresh} aria-hidden="true" />
            {loading && dashboard ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </section>

      {loading && !dashboard ? <DashboardLoadingState /> : null}

      {error && !dashboard ? (
        <DashboardErrorState
          message={error}
          onRetry={() => void loadDashboard()}
        />
      ) : null}

      {dashboard ? <DashboardContent dashboard={dashboard} /> : null}
    </div>
  );
}

function DashboardContent({
  dashboard,
}: {
  dashboard: AdminDashboardResponse;
}) {
  const attentionRows = createAttentionRows(dashboard.summary);
  const branchRows = dashboard.branches.map((branch) => ({
    title: branch.name,
    detail: `${formatNumber(branch.orders)} order requests · ${formatNumber(branch.active_orders)} active · ${formatNumber(branch.pickup_requests)} pickup · ${formatNumber(branch.delivery_requests)} delivery`,
    icon: faLocationDot,
  }));
  const snapshotRows = [
    {
      title: "Customers",
      detail: `${formatNumber(dashboard.summary.registered_customers)} registered · ${formatNumber(dashboard.summary.guest_customers)} guest records`,
      icon: faUsers,
    },
    {
      title: "Staff Accounts",
      detail: `${formatNumber(dashboard.summary.staff)} persisted Staff users`,
      icon: faUserGear,
    },
    {
      title: "Products",
      detail: `${formatNumber(dashboard.summary.products)} persisted catalog products`,
      icon: faBoxOpen,
    },
    {
      title: "Branches",
      detail: `${formatNumber(dashboard.summary.branches)} persisted branch records`,
      icon: faLocationDot,
    },
  ];

  return (
    <>
      <section
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
        aria-label="Admin dashboard summary"
      >
        {metricDefinitions.map((metric) => (
          <Link
            key={metric.key}
            href={metric.href}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            <div className="flex items-start gap-4">
              <span
                className={`grid size-11 shrink-0 place-items-center rounded-lg text-lg ${metric.tone}`}
              >
                <FontAwesomeIcon icon={metric.icon} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-3xl font-bold tracking-tight text-[#0B1930]">
                  {formatNumber(dashboard.summary[metric.key])}
                </p>
                <h3 className="mt-1 font-semibold text-[#0B1930]">
                  {metric.label}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {metric.description(dashboard.summary)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <RecentOrders orders={dashboard.recent_orders} />
        <DashboardList
          title="Needs Attention"
          description="Live operational items that may require review."
          rows={attentionRows}
        />
        <DashboardList
          className="xl:col-span-5"
          title="Branch Overview"
          description="Current order and fulfillment activity by branch."
          rows={branchRows}
          empty="No branch records are available."
        />
        <DashboardList
          className="xl:col-span-5"
          title="System Snapshot"
          description="Persisted records currently visible to Admin."
          rows={snapshotRows}
        />
      </div>
    </>
  );
}

function RecentOrders({
  orders,
}: {
  orders: AdminDashboardRecentOrder[];
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-3">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-lg font-semibold text-[#0B1930]">
            Recent Order Requests
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Latest persisted requests across all branches.
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600"
        >
          View All Orders
          <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
        </Link>
      </div>

      {orders.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Reference",
                  "Customer",
                  "Branch",
                  "Amount",
                  "Fulfillment",
                  "Status",
                  "Created",
                  "Action",
                ].map((column) => (
                  <th
                    key={column}
                    className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.reference} className="hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-[#0B1930]">
                    {order.reference}
                  </td>
                  <td className="max-w-44 truncate px-5 py-4 text-sm text-slate-700">
                    {order.customer?.full_name ?? "Guest Customer"}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                    {order.branch?.name ?? "Unassigned"}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-[#0B1930]">
                    {formatPeso(order.total_amount)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                    {formatLabel(order.fulfillment_method)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <AdminBadge>{formatLabel(order.status)}</AdminBadge>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                    {formatDateTime(order.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <Link
                      href={`/admin/orders?reference=${encodeURIComponent(order.reference)}`}
                      className="font-semibold text-orange-600 hover:text-orange-700 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="No recent order requests." />
      )}
    </section>
  );
}

function DashboardList({
  title,
  description,
  rows,
  className = "xl:col-span-2",
  empty,
}: {
  title: string;
  description: string;
  rows: DashboardListRow[];
  className?: string;
  empty?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <h2 className="text-lg font-semibold text-[#0B1930]">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {rows.length ? (
        <div className="divide-y divide-slate-100">
          {rows.map((row) => (
            <div
              key={row.title}
              className="flex items-center gap-3 px-5 py-4 sm:px-6"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange-50 text-orange-600">
                <FontAwesomeIcon icon={row.icon} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-[#0B1930]">
                  {row.title}
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {row.detail}
                </p>
              </div>
              {row.href && row.action ? (
                <Link
                  href={row.href}
                  className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700"
                >
                  {row.action}
                  <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message={empty ?? "No records are available."} />
      )}
    </section>
  );
}

function createAttentionRows(summary: AdminDashboardSummary): DashboardListRow[] {
  return [
    {
      title: "Payment Verification",
      detail: `${formatNumber(summary.payments_attention)} payments waiting for verification`,
      action: "Review",
      href: "/admin/payments",
      icon: faCreditCard,
    },
    {
      title: "Pending Order Requests",
      detail: `${formatNumber(summary.pending_orders)} order requests waiting for review`,
      action: "View",
      href: "/admin/orders",
      icon: faClipboardList,
    },
    {
      title: "Pickup Requests",
      detail: `${formatNumber(summary.pickups_attention)} pickup requests requiring action`,
      action: "View",
      href: "/admin/pickup-requests",
      icon: faLocationDot,
    },
    {
      title: "Delivery Requests",
      detail: `${formatNumber(summary.deliveries_attention)} delivery requests requiring action`,
      action: "View",
      href: "/admin/delivery-requests",
      icon: faTruck,
    },
    {
      title: "Customer Conversations",
      detail: `${formatNumber(summary.conversations)} open conversations awaiting reply`,
      action: "View",
      href: "/admin/messages",
      icon: faComments,
    },
  ];
}

function DashboardLoadingState() {
  return (
    <div className="space-y-6" aria-live="polite" aria-busy="true">
      <p className="sr-only">Loading the Admin dashboard.</p>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="h-11 w-11 rounded-lg bg-slate-200" />
            <div className="mt-4 h-4 w-2/3 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
          </div>
        ))}
      </section>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-3" />
        <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-2" />
        <div className="h-48 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-5" />
      </div>
    </div>
  );
}

function DashboardErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section
      className="rounded-xl border border-red-200 bg-red-50 p-6"
      role="alert"
    >
      <h2 className="font-semibold text-red-900">Unable to load dashboard</h2>
      <p className="mt-2 text-sm text-red-800">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
      >
        <FontAwesomeIcon icon={faRefresh} aria-hidden="true" />
        Retry
      </button>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="px-6 py-12 text-center text-sm text-slate-500">{message}</p>
  );
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-PH");
}

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
  }).format(value);
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
