"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChartConfiguration } from "chart.js";
import { getAuthToken } from "@/lib/auth/authStorage";
import { getAdminReports, getAdminReportsErrorMessage } from "@/lib/adminReportsApi";
import type { AdminReportsResponse } from "@/lib/adminReportsTypes";
import AdminReportChart from "./AdminReportChart";

type Preset = "month" | "week" | "last30" | "year" | "custom";
const money = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 });
const number = new Intl.NumberFormat("en-PH");

function dateStamp(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function rangeFor(preset: Exclude<Preset, "custom">) {
  const today = new Date();
  const from = new Date(today);
  if (preset === "month") from.setDate(1);
  if (preset === "week") from.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  if (preset === "last30") from.setDate(today.getDate() - 29);
  if (preset === "year") from.setMonth(0, 1);
  return { from: dateStamp(from), to: dateStamp(today) };
}

function labelize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function barConfig(labels: string[], values: number[], label: string, color: string): ChartConfiguration {
  return {
    type: "bar",
    data: { labels, datasets: [{ label, data: values, backgroundColor: color, borderRadius: 6 }] },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true }, y: { grid: { display: false } } },
    },
  };
}

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="font-semibold text-[#0B1930]">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p><div className="mt-5">{children}</div></section>;
}

function MetricCard({ label, value, support }: { label: string; value: string; support: string }) {
  return <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-3xl font-bold tracking-tight text-[#0B1930]">{value}</p><h2 className="mt-1 font-semibold text-[#0B1930]">{label}</h2><p className="mt-1 text-sm text-slate-500">{support}</p></article>;
}

function StatusList({ title, entries }: { title: string; entries: Array<{ label: string; value: number }> }) {
  const total = entries.reduce((sum, entry) => sum + entry.value, 0);
  return <div><h3 className="text-sm font-semibold text-[#0B1930]">{title}</h3><ul className="mt-3 space-y-3">{entries.map((entry) => <li key={entry.label}><div className="flex items-center justify-between gap-3 text-sm"><span className="truncate text-slate-600">{entry.label}</span><span className="font-semibold text-[#0B1930]">{number.format(entry.value)}</span></div><div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-orange-500" style={{ width: `${total ? Math.max((entry.value / total) * 100, entry.value ? 3 : 0) : 0}%` }} /></div></li>)}</ul></div>;
}

function ProductsTable({ products }: { products: AdminReportsResponse["top_products"] }) {
  return <div className="overflow-x-auto rounded-lg border border-slate-200"><table className="min-w-full divide-y divide-slate-200 text-left text-sm"><caption className="sr-only">Top products for the selected report period</caption><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Units</th><th className="px-4 py-3">Orders</th><th className="px-4 py-3">Revenue</th></tr></thead><tbody className="divide-y divide-slate-100">{products.map((product) => <tr key={product.product_id}><td className="whitespace-nowrap px-4 py-3"><p className="font-semibold text-[#0B1930]">{product.name}</p><p className="text-xs text-slate-500">{product.part_number ?? "No part number"}</p></td><td className="px-4 py-3">{number.format(product.units_sold)}</td><td className="px-4 py-3">{number.format(product.orders)}</td><td className="whitespace-nowrap px-4 py-3 font-semibold">{money.format(product.revenue)}</td></tr>)}</tbody></table></div>;
}

export default function AdminReportsPage() {
  const initial = rangeFor("month");
  const [preset, setPreset] = useState<Preset>("month");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [branchId, setBranchId] = useState<number | "">("");
  const [data, setData] = useState<AdminReportsResponse | null>(null);
  const [loading, setLoading] = useState(() => Boolean(getAuthToken()));
  const [error, setError] = useState<string | null>(() => getAuthToken() ? null : "Your Admin session has expired. Please sign in again.");

  useEffect(() => {
    const token = getAuthToken();
    const controller = new AbortController();
    if (!token) {
      return () => controller.abort();
    }
    void getAdminReports(token, { from, to, branchId, signal: controller.signal }).then(setData).catch((requestError: unknown) => {
      if (requestError instanceof Error && requestError.name === "AbortError") return;
      setError(getAdminReportsErrorMessage(requestError));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [branchId, from, to]);

  const trendChart = useMemo<ChartConfiguration | null>(() => data ? ({
    type: "line",
    data: { labels: data.order_trend.map((point) => point.label), datasets: [
      { label: "Orders", data: data.order_trend.map((point) => point.orders), borderColor: "#0B1930", backgroundColor: "rgba(11,25,48,.08)", fill: true, tension: 0.35, yAxisID: "orders" },
      { label: "Revenue", data: data.order_trend.map((point) => point.revenue), borderColor: "#f97316", backgroundColor: "rgba(249,115,22,.08)", fill: true, tension: 0.35, yAxisID: "revenue" },
    ] },
    options: { responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false }, scales: { orders: { beginAtZero: true, position: "left" }, revenue: { beginAtZero: true, position: "right", grid: { drawOnChartArea: false } } } },
  }) : null, [data]);

  const statusChart = useMemo<ChartConfiguration | null>(() => data ? ({
    type: "doughnut",
    data: { labels: data.order_statuses.map((entry) => entry.label), datasets: [{ data: data.order_statuses.map((entry) => entry.value), backgroundColor: data.order_statuses.map((entry) => entry.color), borderWidth: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } },
  }) : null, [data]);

  const fulfillmentChart = useMemo<ChartConfiguration | null>(() => data ? barConfig(data.fulfillment.map((entry) => entry.label), data.fulfillment.map((entry) => entry.orders), "Orders", "#0B1930") : null, [data]);
  const paymentChart = useMemo<ChartConfiguration | null>(() => data ? barConfig(data.payments.methods.map((entry) => entry.label), data.payments.methods.map((entry) => entry.value), "Payments", "#f97316") : null, [data]);
  const branchChart = useMemo<ChartConfiguration | null>(() => data ? barConfig(data.branches.map((entry) => entry.branch), data.branches.map((entry) => entry.revenue), "Revenue", "#16a34a") : null, [data]);
  const categoryChart = useMemo<ChartConfiguration | null>(() => data ? barConfig(data.categories.map((entry) => entry.label), data.categories.map((entry) => entry.revenue), "Revenue", "#6366f1") : null, [data]);
  const brandChart = useMemo<ChartConfiguration | null>(() => data ? barConfig(data.brands.map((entry) => entry.label), data.brands.map((entry) => entry.revenue), "Revenue", "#8b5cf6") : null, [data]);

  const choosePreset = (next: Preset) => {
    setLoading(true);
    setError(null);
    setPreset(next);
    if (next !== "custom") {
      const nextRange = rangeFor(next);
      setFrom(nextRange.from);
      setTo(nextRange.to);
    }
  };
  const noData = data && data.overview.total_orders === 0 && data.customers.total === 0 && data.reviews.total === 0;

  return <div className="space-y-6">
    <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[.18em] text-orange-600">Business insights</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl">Reports &amp; Analytics</h2><p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">Review real order, payment, fulfillment, branch, product, customer, and review performance.</p></div><div className="text-sm text-slate-500">{data ? `${data.filters.from} to ${data.filters.to}` : "Loading report period"}</div></section>
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Report filters"><div className="flex flex-wrap gap-2">{([["month", "This Month"], ["week", "This Week"], ["last30", "Last 30 Days"], ["year", "This Year"], ["custom", "Custom Range"]] as const).map(([value, label]) => <button key={value} type="button" onClick={() => choosePreset(value)} className={`min-h-10 rounded-lg px-3 text-sm font-semibold transition ${preset === value ? "bg-[#0B1930] text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{label}</button>)}</div><div className="mt-4 grid gap-3 sm:grid-cols-3"><label className="text-sm font-medium text-slate-700">From<input type="date" value={from} onChange={(event) => { setLoading(true); setError(null); setPreset("custom"); setFrom(event.target.value); }} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label><label className="text-sm font-medium text-slate-700">To<input type="date" value={to} onChange={(event) => { setLoading(true); setError(null); setPreset("custom"); setTo(event.target.value); }} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label><label className="text-sm font-medium text-slate-700">Branch<select value={branchId} onChange={(event) => { setLoading(true); setError(null); setBranchId(event.target.value ? Number(event.target.value) : ""); }} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="">All branches</option>{data?.filters.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label></div></section>
    {loading && <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600" role="status">Loading report data…</div>}
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700" role="alert"><p className="font-semibold">Unable to load reports</p><p className="mt-1">{error}</p></div>}
    {data && !error && <>
      {noData && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">No data for this period. Try a wider date range or another branch.</div>}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Report overview"><MetricCard label="Total Orders" value={number.format(data.overview.total_orders)} support={`${number.format(data.overview.successful_orders)} successful fulfillment(s)`} /><MetricCard label="Successful Orders" value={number.format(data.overview.successful_orders)} support={`${number.format(data.overview.paid_orders)} paid order(s)`} /><MetricCard label="Revenue Collected" value={money.format(data.overview.revenue_collected)} support="Paid, non-rejected orders" /><MetricCard label="Average Order Value" value={money.format(data.overview.average_order_value)} support="Across paid orders" /></section>
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(20rem,1fr)]"><ChartCard title="Orders and revenue over time" description="Daily, weekly, or monthly buckets based on the selected period.">{trendChart && <AdminReportChart config={trendChart} label="Orders and revenue trend chart" />}</ChartCard><ChartCard title="Orders by status" description="The canonical order statuses currently in the backend.">{statusChart && <AdminReportChart config={statusChart} label="Order status distribution chart" />}</ChartCard></section>
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2"><ChartCard title="Fulfillment mix" description="Store pickup versus Lalamove delivery orders.">{fulfillmentChart && <AdminReportChart config={fulfillmentChart} label="Fulfillment mix chart" />}</ChartCard><ChartCard title="Payment methods" description="Payment records in the selected period.">{paymentChart && <AdminReportChart config={paymentChart} label="Payment methods chart" />}</ChartCard></section>
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2"><ChartCard title="Branch performance" description="Collected revenue by branch.">{branchChart && <AdminReportChart config={branchChart} label="Branch revenue chart" />}</ChartCard><ChartCard title="Category performance" description="Revenue from successful-order item snapshots.">{categoryChart && <AdminReportChart config={categoryChart} label="Category revenue chart" />}</ChartCard></section>
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2"><ChartCard title="Brand performance" description="Revenue grouped by the brand attached to successful order items.">{brandChart && <AdminReportChart config={brandChart} label="Brand revenue chart" />}</ChartCard><ChartCard title="Pickup and delivery status" description="Fulfillment request statuses from this period."><div className="grid gap-6 sm:grid-cols-2"><StatusList title="Pickup" entries={data.pickup} /><StatusList title="Delivery" entries={data.delivery} /></div></ChartCard></section>
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(20rem,1fr)]"><ChartCard title="Top products" description="Top ten products by successful-order units and historical revenue.">{data.top_products.length ? <ProductsTable products={data.top_products} /> : <p className="text-sm text-slate-500">No successful products in this period.</p>}</ChartCard><ChartCard title="Customer and review analytics" description="Registered versus guest customers and review activity."><div className="grid grid-cols-2 gap-3">{[["Customers", data.customers.total], ["Registered", data.customers.registered], ["Guests", data.customers.guests], ["Repeat", data.customers.repeat_customers], ["New", data.customers.new_registered], ["Reviews", data.reviews.total]].map(([label, value]) => <div key={String(label)} className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-[#0B1930]">{number.format(Number(value))}</p></div>)}</div><div className="mt-6"><StatusList title={`Reviews · ${data.reviews.average_rating.toFixed(2)} average rating`} entries={data.reviews.statuses} /></div></ChartCard></section>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="font-semibold text-[#0B1930]">Recent successful orders</h2><p className="mt-1 text-sm text-slate-500">Orders counted as successful after paid and fulfilled completion.</p><div className="mt-4 overflow-x-auto"><table className="min-w-full divide-y divide-slate-200 text-left text-sm"><caption className="sr-only">Recent successful orders</caption><thead className="text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Reference</th><th className="px-3 py-3">Branch</th><th className="px-3 py-3">Fulfillment</th><th className="px-3 py-3">Total</th></tr></thead><tbody className="divide-y divide-slate-100">{data.recent_successful_orders.map((order) => <tr key={order.reference}><td className="px-3 py-3 font-semibold text-[#0B1930]">{order.reference}</td><td className="px-3 py-3">{order.branch ?? "Unassigned"}</td><td className="px-3 py-3">{labelize(order.fulfillment)}</td><td className="px-3 py-3 font-semibold">{money.format(order.total_amount)}</td></tr>)}</tbody></table>{!data.recent_successful_orders.length && <p className="py-5 text-center text-sm text-slate-500">No successful orders in this period.</p>}</div></section>
    </>}
  </div>;
}
