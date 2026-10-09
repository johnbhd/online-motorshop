"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import StaffPageHeader from "@/components/staff/StaffPageHeader";
import { usePortalNotifications } from "./usePortalNotifications";
import type { PortalNotificationCategory, PortalRole } from "@/lib/portalNotifications/portalNotificationApi";

const filters: { label: string; value: PortalNotificationCategory }[] = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Orders", value: "orders" },
  { label: "Assignments", value: "assignments" },
  { label: "Payments", value: "payments" },
  { label: "Pickup", value: "pickup" },
  { label: "Delivery", value: "delivery" },
  { label: "Messages", value: "messages" },
  { label: "Attention", value: "attention" },
];

function formatTime(value: string | null) {
  if (!value) return "Time unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Time unavailable" : new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function linkFor(role: PortalRole, notification: ReturnType<typeof usePortalNotifications>["notifications"][number]) {
  const prefix = `/${role}`;
  const reference = notification.reference;
  if (reference.type === "order" && reference.order_reference) return `${prefix}/orders?reference=${encodeURIComponent(reference.order_reference)}`;
  if (notification.category === "payments" || reference.payment_id) return `${prefix}/payments`;
  if (notification.category === "delivery" || reference.delivery_id) return `${prefix}/delivery-requests`;
  if (notification.category === "pickup" || reference.pickup_id) return `${prefix}/pickup-requests`;
  if (reference.type === "conversation" || reference.conversation_id) return `${prefix}/messages`;
  return null;
}

export default function PortalNotificationsPage({ role }: { role: PortalRole }) {
  const router = useRouter();
  const [category, setCategory] = useState<PortalNotificationCategory>("all");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const { notifications, unreadCount, meta, loading, error, markRead, markAllRead } = usePortalNotifications(role, { category, page, perPage: 10 });
  const shown = notifications.filter((item) => `${item.title} ${item.message} ${item.category}`.toLowerCase().includes(query.trim().toLowerCase()));
  const isStaff = role === "staff";

  const openNotification = async (id: string) => {
    const item = notifications.find((notification) => notification.id === id);
    if (!item) return;
    try {
      await markRead(item);
    } finally {
      const href = linkFor(role, item);
      if (href) router.push(href);
    }
  };

  return (
    <div className="space-y-5">
      <StaffPageHeader eyebrow="Updates" title="Notifications" description={isStaff ? "Branch assignments, payments, orders, delivery, and customer messages." : "Important orders, payments, delivery work, and customer activity across ALD branches."}>
        <button type="button" onClick={() => void markAllRead()} disabled={!unreadCount} className="min-h-11 rounded-lg border border-orange-400 px-4 text-sm font-semibold text-orange-600 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50">Mark All Read</button>
      </StaffPageHeader>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-5" role="tablist" aria-label="Notification filters">
            {filters.map((filter) => <button key={filter.value} type="button" onClick={() => { setCategory(filter.value); setPage(1); }} className={`border-b-2 pb-2 text-sm font-semibold ${category === filter.value ? "border-orange-500 text-[#0B1930]" : "border-transparent text-slate-500"}`}>{filter.label}{filter.value === "unread" && <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">{unreadCount > 99 ? "99+" : unreadCount}</span>}</button>)}
          </div>
          <input aria-label="Search notifications" value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-orange-400" placeholder="Search notifications" />
        </div>
        {error && <div className="m-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}
        <div>
          {loading ? <div className="px-6 py-16 text-center text-sm text-slate-500">Loading notifications…</div> : shown.map((item) => <button key={item.id} type="button" onClick={() => void openNotification(item.id)} className={`flex w-full gap-4 border-b border-slate-100 px-5 py-4 text-left hover:bg-slate-50 ${item.read ? "" : "bg-orange-50/40"}`}><span className="grid size-10 shrink-0 place-items-center rounded-full bg-orange-100 text-xs font-bold text-orange-700" aria-hidden="true">{item.category.slice(0, 1).toUpperCase()}</span><span className="min-w-0"><span className="flex items-center gap-2"><b className="text-sm text-[#0B1930]">{item.title}</b>{!item.read && <i className="size-2 rounded-full bg-orange-500" aria-label="Unread" />}</span><span className="mt-1 block text-sm text-slate-600">{item.message}</span><span className="mt-1 block text-xs text-slate-400">{item.category} · {formatTime(item.created_at)}</span></span></button>)}
          {!loading && !shown.length && <div className="px-6 py-16 text-center"><b className="text-[#0B1930]">No notifications found</b><p className="mt-1 text-sm text-slate-500">You&apos;re all caught up.</p></div>}
        </div>
        {meta.last_page > 1 && <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm"><span className="text-slate-500">Page {meta.current_page} of {meta.last_page}</span><div className="flex gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-slate-300 px-3 py-2 font-semibold disabled:opacity-40">Previous</button><button type="button" disabled={page >= meta.last_page || loading} onClick={() => setPage((current) => Math.min(meta.last_page, current + 1))} className="rounded-lg border border-slate-300 px-3 py-2 font-semibold disabled:opacity-40">Next</button></div></div>}
      </section>
      <p className="text-xs text-slate-500"><Link href={`/${role}`} className="font-semibold text-orange-600 hover:underline">Back to {isStaff ? "staff" : "admin"} dashboard</Link></p>
    </div>
  );
}
