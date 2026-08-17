"use client";
import { useMemo, useState } from "react";
export type Column<T> = {
  label: string;
  render: (row: T) => React.ReactNode;
  search?: (row: T) => string;
};
const badgeTone = (value: string) =>
  /cancel|failed|out of stock|flagged/i.test(value)
    ? "bg-red-50 text-red-700 ring-red-200"
    : /paid|completed|available|published|ready/i.test(value)
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : /pending|waiting|low stock|confirmation/i.test(value)
        ? "bg-orange-50 text-orange-700 ring-orange-200"
        : "bg-blue-50 text-blue-700 ring-blue-200";
export function Badge({ children }: { children: string }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${badgeTone(children)}`}
    >
      {children}
    </span>
  );
}
export default function PortalTable<T extends object>({
  title,
  description,
  rows,
  columns,
  tabs,
  tabValue,
  empty = "No records found",
  children,
}: {
  title: string;
  description: string;
  rows: T[];
  columns: Column<T>[];
  tabs?: string[];
  tabValue?: (row: T, tab: string) => boolean;
  empty?: string;
  children?: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("All");
  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        const text = columns
          .map((c) => c.search?.(row) ?? "")
          .join(" ")
          .toLowerCase();
        return (
          text.includes(query.toLowerCase()) &&
          (!tabs || tab === "All" || tabValue?.(row, tab))
        );
      }),
    [rows, columns, query, tab, tabs, tabValue],
  );
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {tabs && (
        <div className="border-b border-slate-200 px-5">
          <div className="flex min-w-max gap-6 overflow-x-auto">
            {tabs.map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`min-h-14 border-b-2 text-sm font-semibold ${tab === item ? "border-orange-500 text-[#0B1930]" : "border-transparent text-slate-500 hover:text-[#0B1930]"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-lg font-semibold text-[#0B1930]">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <label className="relative block w-full sm:w-80">
          <span className="pointer-events-none absolute left-3 top-2.5 text-slate-400">
            ⌕
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="min-h-10 w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </label>
      </div>
      {children}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.label}
                  className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((row, index) => (
              <tr key={index} className="transition hover:bg-slate-50/80">
                {columns.map((c) => (
                  <td
                    key={c.label}
                    className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-600"
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!filtered.length && (
        <div className="px-6 py-16 text-center">
          <p className="font-semibold text-[#0B1930]">{empty}</p>
          <p className="mt-1 text-sm text-slate-500">
            Try changing your search or selected tab.
          </p>
        </div>
      )}
      <div className="border-t border-slate-200 px-5 py-4 text-sm text-slate-500 sm:px-6">
        Showing{" "}
        <span className="font-semibold text-slate-700">
          {filtered.length ? `1–${filtered.length}` : "0"}
        </span>{" "}
        of <span className="font-semibold text-slate-700">{rows.length}</span>{" "}
        records
      </div>
    </section>
  );
}
