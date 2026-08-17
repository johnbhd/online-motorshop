"use client";
import AdminDataTable, { AdminBadge } from "@/components/admin/AdminDataTable";
import type { Column } from "@/components/staff/PortalTable";
import { adminCustomers, type AdminCustomer } from "@/lib/mock/admin";
const cols: Column<AdminCustomer>[] = [
  {
    label: "Customer",
    render: (r) => (
      <span className="flex items-center gap-3">
        <i className="grid size-9 place-items-center rounded-full bg-slate-100 text-xs font-bold not-italic text-slate-600">
          {r.initials}
        </i>
        <span>
          <b className="block text-[#0B1930]">{r.name}</b>
          <small>{r.email}</small>
        </span>
      </span>
    ),
    search: (r) => `${r.name} ${r.email}`,
  },
  {
    label: "Type",
    render: (r) => <AdminBadge>{r.type}</AdminBadge>,
    search: (r) => r.type,
  },
  { label: "Contact", render: (r) => r.contact },
  { label: "Location", render: (r) => r.location, search: (r) => r.location },
  { label: "Branch", render: (r) => r.branch, search: (r) => r.branch },
  { label: "Orders", render: (r) => r.orders },
  { label: "Total Ordered", render: (r) => <b>{r.totalOrdered}</b> },
  { label: "Last Order", render: (r) => r.lastOrder },
  {
    label: "Activity",
    render: (r) => <AdminBadge>{r.status}</AdminBadge>,
    search: (r) => r.status,
  },
  {
    label: "Action",
    render: () => (
      <button className="rounded-lg border border-orange-400 px-3 py-1.5 text-xs font-semibold text-orange-600">
        View
      </button>
    ),
  },
];
export default function Customers() {
  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">
            Customer Management
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl">
            Customer Records
          </h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Review customer activity, order history, and account type across all
            branches.
          </p>
        </div>
      </section>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["124", "Total Customers", "All customer records"],
          ["31", "Customers This Month", "New customers this month"],
          ["27", "Returning Customers", "Ordered more than once"],
          ["47 / 77", "Registered / Guest", "Customer account breakdown"],
        ].map(([value, label, desc]) => (
          <article
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-3xl font-bold text-[#0B1930]">{value}</p>
            <h3 className="mt-1 font-semibold text-[#0B1930]">{label}</h3>
            <p className="mt-1 text-sm text-slate-500">{desc}</p>
          </article>
        ))}
      </section>
      <AdminDataTable
        title="Customer List"
        description="124 customer records"
        rows={adminCustomers}
        columns={cols}
        tabs={["All", "Registered", "Guest", "Returning", "New"]}
        matchTab={(r, t) => r.type === t || r.status === t}
        filters={[
          {
            label: "Branch",
            value: (r) => r.branch,
            options: ["Manila", "Makati", "Imus"],
          },
          {
            label: "Type",
            value: (r) => r.type,
            options: ["Registered", "Guest"],
          },
          {
            label: "Activity",
            value: (r) => r.status,
            options: ["Returning", "New"],
          },
        ]}
      />
    </div>
  );
}
