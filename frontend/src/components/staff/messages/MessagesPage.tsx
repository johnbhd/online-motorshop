"use client";
import { useMemo, useState } from "react";
import StaffPageHeader from "@/components/staff/StaffPageHeader";
import { conversations as initial } from "@/lib/mock/staff";
const tone = (s: string) =>
  s === "New"
    ? "bg-orange-50 text-orange-700"
    : s === "Resolved"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-blue-50 text-blue-700";
export default function Messages() {
  const [items, setItems] = useState(initial);
  const [selected, setSelected] = useState<number>(1);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [draft, setDraft] = useState("");
  const conversations = useMemo(
    () =>
      items.filter(
        (c) =>
          (filter === "all" ||
            (filter === "unread" ? c.unread : c.status === filter)) &&
          `${c.customer.name} ${c.lastMessage}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [items, query, filter],
  );
  const active = items.find((x) => x.id === selected) ?? items[0];
  const choose = (id: number) => {
    setSelected(id);
    setItems(items.map((x) => (x.id === id ? { ...x, unread: false } : x)));
  };
  const send = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    setItems(
      items.map((x) =>
        x.id === active.id
          ? {
              ...x,
              lastMessage: draft,
              updatedAt: "Just now",
              messages: [
                ...x.messages,
                { sender: "staff", message: draft, time: "Just now" },
              ],
            }
          : x,
      ),
    );
    setDraft("");
  };
  return (
    <div className="space-y-5">
      <StaffPageHeader
        eyebrow="Customer Support"
        title="Messages"
        description="Respond to customer product, order, pickup, and delivery inquiries."
      />
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid min-h-[620px] lg:grid-cols-[22rem_minmax(0,1fr)]">
          <aside className="border-r border-slate-200">
            <div className="border-b border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-[#0B1930]">Conversations</h2>
                <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-bold text-orange-700">
                  {items.filter((x) => x.unread).length} unread
                </span>
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="mt-4 min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-orange-400"
                placeholder="Search conversations"
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="mt-3 min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
              >
                <option value="all">All conversations</option>
                <option value="unread">Unread</option>
                <option value="New">New</option>
                <option value="Open">Open</option>
                <option value="Waiting">Waiting</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
            <div className="max-h-[530px] overflow-y-auto">
              {conversations.map((c) => (
                <button
                  onClick={() => choose(c.id)}
                  key={c.id}
                  className={`flex w-full gap-3 border-l-4 px-4 py-4 text-left ${active.id === c.id ? "border-orange-500 bg-orange-50" : "border-transparent hover:bg-slate-50"}`}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                    {c.customer.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <b className="min-w-0 flex-1 truncate text-sm text-[#0B1930]">
                        {c.customer.name}
                      </b>
                      {c.unread && (
                        <i className="size-2 rounded-full bg-orange-500" />
                      )}
                    </span>
                    <span className="mt-1 block truncate text-sm text-slate-500">
                      {c.lastMessage}
                    </span>
                    <span className="mt-2 flex items-center justify-between">
                      <small className="text-slate-400">{c.updatedAt}</small>
                      <i
                        className={`rounded-full px-2 py-0.5 text-[11px] not-italic font-semibold ${tone(c.status)}`}
                      >
                        {c.status}
                      </i>
                    </span>
                  </span>
                </button>
              ))}
              {!conversations.length && (
                <p className="p-6 text-center text-sm text-slate-500">
                  No conversations found.
                </p>
              )}
            </div>
          </aside>
          <section className="flex min-h-[620px] flex-col">
            <header className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
              <span className="grid size-10 place-items-center rounded-full bg-[#0B1930] text-xs font-bold text-white">
                {active.customer.initials}
              </span>
              <div>
                <h2 className="font-semibold text-[#0B1930]">
                  {active.customer.name}
                </h2>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone(active.status)}`}
                >
                  {active.status}
                </span>
              </div>
            </header>
            <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/50 p-5">
              {active.messages.map((m, index) => (
                <div
                  key={index}
                  className={`flex ${m.sender === "staff" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm text-slate-800 sm:max-w-[70%] ${m.sender === "staff" ? "rounded-br-md border border-orange-200 bg-orange-50" : "rounded-bl-md bg-slate-200/80"}`}
                  >
                    <p>{m.message}</p>
                    <p className="mt-1.5 text-right text-[11px] text-slate-500">
                      {m.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <form
              onSubmit={send}
              className="flex gap-3 border-t border-slate-200 p-4"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="min-h-11 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-orange-400"
                placeholder="Write a reply..."
              />
              <button className="min-h-11 rounded-lg bg-orange-500 px-5 text-sm font-semibold text-white hover:bg-orange-600">
                Send
              </button>
            </form>
          </section>
        </div>
      </section>
    </div>
  );
}
