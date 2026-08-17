"use client";
import { useMemo, useState } from "react";
import type { Column } from "@/components/staff/PortalTable";
export function AdminBadge({ children }: { children: string }) {
  const tone = /cancel|failed|out of stock/i.test(children)
    ? "bg-red-50 text-red-700 ring-red-200"
    : /paid|completed|available|active|ready/i.test(children)
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : /pending|waiting|low stock/i.test(children)
        ? "bg-orange-50 text-orange-700 ring-orange-200"
        : "bg-blue-50 text-blue-700 ring-blue-200";
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tone}`}
    >
      {children}
    </span>
  );
}
type Filter<T> = {
  label: string;
  value: (row: T) => string;
  options: string[];
};
export default function AdminDataTable<T extends object>({
  title,
  description,
  rows,
  columns,
  tabs,
  matchTab,
  filters = [],
}: {
  title: string;
  description: string;
  rows: T[];
  columns: Column<T>[];
  tabs: string[];
  matchTab: (row: T, tab: string) => boolean;
  filters?: Filter<T>[];
}) {
  const [tab, setTab] = useState("All");
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<string[]>(
    filters.map(() => "All"),
  );
  const results = useMemo(
    () =>
      rows.filter((row) => {
        const text = columns
          .map((c) => c.search?.(row) ?? "")
          .join(" ")
          .toLowerCase();
        return (
          text.includes(query.toLowerCase()) &&
          (tab === "All" || matchTab(row, tab)) &&
          filters.every(
            (filter, index) =>
              filterValues[index] === "All" ||
              filter.value(row) === filterValues[index],
          )
        );
      }),
    [rows, columns, query, tab, matchTab, filters, filterValues],
  );
  const clear = () => {
    setTab("All");
    setQuery("");
    setFilterValues(filters.map(() => "All"));
  };
  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white px-4 shadow-sm sm:px-5">
        <div className="overflow-x-auto">
          <div className="flex min-w-max items-center gap-6" role="tablist">
            {tabs.map((item) => (
              <button
                onClick={() => setTab(item)}
                key={item}
                role="tab"
                aria-selected={tab === item}
                className={`inline-flex min-h-14 items-center gap-2 border-b-2 px-.5 text-sm font-semibold ${tab === item ? "border-orange-500 text-[#0B1930]" : "border-transparent text-slate-500 hover:text-[#0B1930]"}`}
              >
                {item}
                <span className="rounded-full bg-slate-100 px-1.5 py-.5 text-[11px] font-bold text-slate-600">
                  {item === "All"
                    ? rows.length
                    : rows.filter((r) => matchTab(r, item)).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(17rem,1fr)_repeat(4,minmax(8rem,1fr))_auto]">
          <label className="relative block">
            <span className="absolute left-3.5 top-2.5 text-slate-400">⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              placeholder="Search orders, customers, or reference"
            />
          </label>
          {filters.map((filter, index) => (
            <select
              key={filter.label}
              value={filterValues[index]}
              onChange={(e) =>
                setFilterValues(
                  filterValues.map((v, i) =>
                    i === index ? e.target.value : v,
                  ),
                )
              }
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700"
            >
              <option>All</option>
              {filter.options.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          ))}
          <button
            onClick={clear}
            className="min-h-11 rounded-lg px-3 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-orange-600"
          >
            ↻ Clear
          </button>
        </div>
      </section>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-[#0B1930]">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left">
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
              {results.map((row, index) => (
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
        {!results.length && (
          <div className="px-6 py-16 text-center">
            <b className="text-[#0B1930]">No records found</b>
            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filters.
            </p>
          </div>
        )}
        <div className="border-t border-slate-200 px-5 py-4 text-sm text-slate-500 sm:px-6">
          Showing{" "}
          <b className="text-slate-700">
            {results.length ? `1–${results.length}` : "0"}
          </b>{" "}
          of <b className="text-slate-700">{rows.length}</b> records
        </div>
      </section>
    </>
  );
}
