"use client";
import { useMemo, useState } from "react";
import StaffPageHeader from "@/components/staff/StaffPageHeader";
import { notifications as source } from "@/lib/mock/staff";
export default function Notifications() {
  const [items, setItems] = useState(source);
  const [tab, setTab] = useState("All");
  const [query, setQuery] = useState("");
  const show = useMemo(
    () =>
      items.filter(
        (item) =>
          (tab === "All" || tab === "Unread" ? item.unread : !item.unread) &&
          `${item.title} ${item.description} ${item.type}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [items, tab, query],
  );
  const unread = items.filter((x) => x.unread).length;
  return (
    <div className="space-y-5">
      <StaffPageHeader
        eyebrow="Updates"
        title="Notifications"
        description="Stay updated on orders, payments, requests, messages, and customer activity."
      >
        <button
          onClick={() => setItems(items.map((x) => ({ ...x, unread: false })))}
          className="min-h-11 rounded-lg border border-orange-400 px-4 text-sm font-semibold text-orange-600 hover:bg-orange-50"
        >
          Mark All Read
        </button>
      </StaffPageHeader>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-6">
            {["All", "Unread", "Read"].map((x) => (
              <button
                key={x}
                onClick={() => setTab(x)}
                className={`border-b-2 pb-2 text-sm font-semibold ${tab === x ? "border-orange-500 text-[#0B1930]" : "border-transparent text-slate-500"}`}
              >
                {x}
                {x === "Unread" && (
                  <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                    {unread}
                  </span>
                )}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-orange-400"
            placeholder="Search notifications"
          />
        </div>
        <div>
          {show.map((item) => (
            <button
              key={item.id}
              onClick={() =>
                setItems(
                  items.map((x) =>
                    x.id === item.id ? { ...x, unread: false } : x,
                  ),
                )
              }
              className={`flex w-full gap-4 border-b border-slate-100 px-5 py-4 text-left hover:bg-slate-50 ${item.unread ? "bg-orange-50/40" : ""}`}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-orange-600">
                ●
              </span>
              <span>
                <span className="flex items-center gap-2">
                  <b className="text-sm text-[#0B1930]">{item.title}</b>
                  {item.unread && (
                    <i className="size-2 rounded-full bg-orange-500" />
                  )}
                </span>
                <p className="mt-1 text-sm text-slate-600">
                  {item.description}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {item.type} · {item.time}
                </p>
              </span>
            </button>
          ))}
          {!show.length && (
            <div className="px-6 py-16 text-center">
              <b className="text-[#0B1930]">No notifications found</b>
              <p className="mt-1 text-sm text-slate-500">
                You&apos;re all caught up.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
