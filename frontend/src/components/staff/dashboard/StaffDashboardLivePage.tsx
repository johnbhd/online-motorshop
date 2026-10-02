"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faCalendarDays,
  faClipboardList,
  faComments,
  faCreditCard,
  faRefresh,
  faStore,
  faTruck,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { Badge } from "@/components/staff/PortalTable";
import StaffPageHeader from "@/components/staff/StaffPageHeader";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getStaffDashboard,
  getStaffDashboardErrorMessage,
} from "./staffDashboardApi";
import type {
  StaffDashboardOperational,
  StaffDashboardResponse,
  StaffDashboardSummary,
} from "./staffDashboardTypes";

type SummaryCardDefinition = {
  key: keyof StaffDashboardSummary;
  label: string;
  detail: string;
  href: string;
  icon: IconDefinition;
};

type StatusRow = {
  label: string;
  count: number;
  color: string;
};

const summaryCards: SummaryCardDefinition[] = [
  {
    key: "active_orders",
    label: "Active Orders",
    detail: "Orders still in the operational workflow",
    href: "/staff/orders",
    icon: faClipboardList,
  },
  {
    key: "pending_orders",
    label: "Pending Orders",
    detail: "Awaiting Staff review",
    href: "/staff/orders",
    icon: faClipboardList,
  },
  {
    key: "payments_attention",
    label: "Payments to Verify",
    detail: "Waiting for payment verification",
    href: "/staff/payments",
    icon: faCreditCard,
  },
  {
    key: "pickups_attention",
    label: "Pickup Requests",
    detail: "Pickup requests requiring action",
    href: "/staff/pickup-requests",
    icon: faStore,
  },
  {
    key: "deliveries_attention",
    label: "Delivery Requests",
    detail: "Delivery requests requiring action",
    href: "/staff/delivery-requests",
    icon: faTruck,
  },
  {
    key: "conversations",
    label: "Customer Conversations",
    detail: "Open conversations awaiting Staff reply",
    href: "/staff/messages",
    icon: faComments,
  },
];

const orderStatusOrder = [
  "pending",
  "under_review",
  "confirmed",
  "waiting_for_payment",
  "payment_verification",
  "preparing_order",
  "ready_for_pickup",
  "booked_for_delivery",
  "picked_up_by_rider",
  "waiting_for_booking",
  "completed",
  "rejected",
  "cancelled",
];

const paymentStatusOrder = [
  "waiting_for_verification",
  "waiting_for_payment",
  "paid",
  "failed",
  "refunded",
  "cancelled",
  "unpaid",
];

const pickupStatusOrder = [
  "pending",
  "preparing",
  "ready_for_pickup",
  "completed",
  "cancelled",
];

const deliveryStatusOrder = [
  "waiting_for_booking",
  "booked",
  "picked_up",
  "in_transit",
  "delivered",
  "failed",
  "cancelled",
];

const statusColors = [
  "bg-orange-500",
  "bg-[#0B1930]",
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-rose-500",
];

export default function StaffDashboardLivePage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<StaffDashboardResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (signal?: AbortSignal) => {
    const token = getAuthToken();

    if (!token) {
      setDashboard(null);
      setError("Your Staff session has expired. Please sign in again.");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await getStaffDashboard(token, signal);

      setDashboard(response);
      setError(null);
    } catch (loadError) {
      if (loadError instanceof Error && loadError.name === "AbortError") {
        return;
      }

      setDashboard(null);
      setError(getStaffDashboardErrorMessage(loadError));
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

  const branchName = dashboard?.branch?.name ?? "your branch";
  const staffName = user?.name ?? "Staff";

  return (
    <div className="space-y-6">
      <StaffPageHeader
        eyebrow="Staff Dashboard"
        title={`${getGreeting()}, ${staffName}`}
        description={`Live operational summary for ${branchName}.`}
      >
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
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </StaffPageHeader>

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
  dashboard: StaffDashboardResponse;
}) {
  const orderRows = useMemo(
    () => createStatusRows(dashboard.operational.orders, orderStatusOrder),
    [dashboard.operational.orders],
  );
  const paymentRows = useMemo(
    () => createStatusRows(dashboard.operational.payments, paymentStatusOrder),
    [dashboard.operational.payments],
  );
  const fulfillmentRows = useMemo(
    () => createFulfillmentRows(dashboard.operational),
    [dashboard.operational],
  );

  return (
    <>
      <section
        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        aria-label="Operational summary"
      >
        {summaryCards.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-11 place-items-center rounded-lg bg-orange-50 text-lg text-orange-600">
                <FontAwesomeIcon icon={card.icon} aria-hidden="true" />
              </span>
              <b className="text-3xl tracking-tight text-[#0B1930]">
                {dashboard.summary[card.key]}
              </b>
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-[#0B1930]">{card.label}</h2>
              <FontAwesomeIcon
                icon={faArrowRight}
                className="text-slate-300 transition group-hover:text-orange-500"
                aria-hidden="true"
              />
            </div>
            <p className="mt-1 text-sm text-slate-500">{card.detail}</p>
          </Link>
        ))}
      </section>

      <RecentOrders orders={dashboard.recent_orders} />
      <RecentConversations conversations={dashboard.recent_conversations} />

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <DashboardCard
          title="Order Status"
          description="Current order requests in this branch."
        >
          <StatusRows rows={orderRows} empty="No order statuses yet." />
        </DashboardCard>
        <DashboardCard
          title="Payment Overview"
          description="Persisted payment records by status."
        >
          <StatusRows rows={paymentRows} empty="No persisted payments yet." />
        </DashboardCard>
        <DashboardCard
          title="Fulfillment Attention"
          description="Pickup and delivery work requiring action."
        >
          <StatusRows
            rows={fulfillmentRows}
            empty="No pickup or delivery requests yet."
          />
        </DashboardCard>
      </section>
    </>
  );
}

function RecentOrders({
  orders,
}: {
  orders: StaffDashboardResponse["recent_orders"];
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-lg font-semibold text-[#0B1930]">
            Recent Orders
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Latest persisted order requests for this branch.
          </p>
        </div>
        <Link
          href="/staff/orders"
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
                  "Items",
                  "Total",
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
                    {formatItemCount(order.item_count)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-[#0B1930]">
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                    {formatLabel(order.fulfillment_method)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <Badge>{formatLabel(order.status)}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                    {formatDateTime(order.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <Link
                      href={`/staff/orders/${encodeURIComponent(order.reference)}`}
                      className="font-semibold text-orange-600 hover:text-orange-700 hover:underline"
                    >
                      View Order
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="No recent orders for this branch." />
      )}
    </section>
  );
}

function RecentConversations({
  conversations,
}: {
  conversations: StaffDashboardResponse["recent_conversations"];
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-lg font-semibold text-[#0B1930]">
            Recent Customer Conversations
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Latest open conversations from the Staff inbox.
          </p>
        </div>
        <Link
          href="/staff/messages"
          className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600"
        >
          Open Messages
          <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
        </Link>
      </div>

      {conversations.length ? (
        <div className="divide-y divide-slate-100">
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href="/staff/messages"
              className="flex items-start gap-4 px-5 py-4 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-400 sm:px-6"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-600">
                <FontAwesomeIcon icon={faComments} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <b className="text-sm text-[#0B1930]">
                    {conversation.participant.name}
                  </b>
                  <Badge>Open</Badge>
                </span>
                <span className="mt-1 block truncate text-sm text-slate-600">
                  {conversation.last_message?.body ?? "No messages yet"}
                </span>
                <span className="mt-1 block text-xs text-slate-400">
                  {formatDateTime(
                    conversation.last_message_at ?? conversation.updated_at,
                  )}
                </span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState message="No open customer conversations." />
      )}
    </section>
  );
}

function DashboardCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-[#0B1930]">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-5 space-y-3">{children}</div>
    </article>
  );
}

function StatusRows({
  rows,
  empty,
}: {
  rows: StatusRow[];
  empty: string;
}) {
  if (!rows.length) {
    return <p className="text-sm text-slate-500">{empty}</p>;
  }

  const maximum = Math.max(...rows.map((row) => row.count), 1);

  return rows.map((row) => (
    <div key={row.label} className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-sm text-slate-600">
        {row.label}
      </span>
      <span className="h-2 flex-1 rounded bg-slate-100">
        <i
          className={`block h-2 rounded ${row.color}`}
          style={{ width: `${(row.count / maximum) * 100}%` }}
        />
      </span>
      <b className="w-6 text-right text-sm text-[#0B1930]">{row.count}</b>
    </div>
  ));
}

function DashboardLoadingState() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <span className="sr-only">Loading Staff dashboard</span>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="h-11 w-11 rounded-lg bg-slate-100" />
            <div className="mt-5 h-4 w-40 rounded bg-slate-100" />
            <div className="mt-2 h-3 w-56 rounded bg-slate-100" />
          </div>
        ))}
      </section>
      <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm" />
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
      className="rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center"
      role="alert"
    >
      <h2 className="font-semibold text-red-800">
        Unable to load Staff dashboard
      </h2>
      <p className="mt-2 text-sm text-red-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800"
      >
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

function createStatusRows(
  values: Record<string, number>,
  preferredOrder: string[],
): StatusRow[] {
  const knownRows = preferredOrder
    .filter((status) => values[status] !== undefined && values[status] > 0)
    .map((status, index) => ({
      label: formatLabel(status),
      count: values[status],
      color: statusColors[index % statusColors.length],
    }));
  const knownStatuses = new Set(preferredOrder);
  const unknownRows = Object.entries(values)
    .filter(([status, count]) => !knownStatuses.has(status) && count > 0)
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([status, count], index) => ({
      label: formatLabel(status),
      count,
      color: statusColors[(knownRows.length + index) % statusColors.length],
    }));

  return [...knownRows, ...unknownRows];
}

function createFulfillmentRows(
  operational: StaffDashboardOperational,
): StatusRow[] {
  return [
    {
      label: "Pickup attention",
      count: operational.pickups.active ?? 0,
      color: "bg-emerald-500",
    },
    {
      label: "Delivery attention",
      count: operational.deliveries.active ?? 0,
      color: "bg-violet-500",
    },
    ...createStatusRows(
      Object.fromEntries(
        Object.entries(operational.pickups).filter(([status]) => status !== "active"),
      ),
      pickupStatusOrder,
    ).slice(0, 2),
    ...createStatusRows(
      Object.fromEntries(
        Object.entries(operational.deliveries).filter(([status]) => status !== "active"),
      ),
      deliveryStatusOrder,
    ).slice(0, 2),
  ].filter((row) => row.count > 0);
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatItemCount(count: number) {
  return `${count} ${count === 1 ? "item" : "items"}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(timestamp: Date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(timestamp);
}

function formatDateTime(timestamp: string | null) {
  if (!timestamp) {
    return "No timestamp";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}
