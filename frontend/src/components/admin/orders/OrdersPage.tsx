"use client";
import AdminDataTable, { AdminBadge } from "@/components/admin/AdminDataTable";
import type { Column } from "@/components/staff/PortalTable";
import { adminOrders, type AdminOrder } from "@/lib/mock/admin";
const cols: Column<AdminOrder>[] = [
  {
    label: "Order",
    render: (r) => <b className="text-[#0B1930]">{r.reference}</b>,
    search: (r) => r.reference,
  },
  { label: "Customer", render: (r) => r.customer, search: (r) => r.customer },
  { label: "Branch", render: (r) => r.branch, search: (r) => r.branch },
  { label: "Amount", render: (r) => <b>{r.amount}</b> },
  {
    label: "Fulfillment",
    render: (r) => r.fulfillment,
    search: (r) => r.fulfillment,
  },
  { label: "Assigned Staff", render: (r) => r.staff, search: (r) => r.staff },
  {
    label: "Status",
    render: (r) => <AdminBadge>{r.status}</AdminBadge>,
    search: (r) => r.status,
  },
  { label: "Updated", render: (r) => r.updated },
  {
    label: "Action",
    render: (r) => (
      <button className="rounded-lg border border-orange-400 px-3 py-1.5 text-xs font-semibold text-orange-600">
        {r.action}
      </button>
    ),
  },
];
export default function Orders() {
  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">
            Order Management
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl">
            All Customer Orders
          </h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Review, assign, and manage customer orders across all ALD Motorshop
            branches.
          </p>
        </div>
        <p className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-800">
          ◷ <b>8</b> orders need review
        </p>
      </section>
      <AdminDataTable
        title="Order List"
        description="48 customer order records"
        rows={adminOrders}
        columns={cols}
        tabs={[
          "All",
          "Pending",
          "Under Review",
          "Preparing",
          "Ready for Pickup",
          "Waiting for Booking",
          "In Transit",
          "Completed",
          "Cancelled",
        ]}
        matchTab={(r, t) => r.status === t}
        filters={[
          {
            label: "Branch",
            value: (r) => r.branch,
            options: ["Manila", "Makati", "Imus"],
          },
          {
            label: "Fulfillment",
            value: (r) => r.fulfillment,
            options: ["Store Pickup", "Lalamove Delivery"],
          },
          {
            label: "Assigned staff",
            value: (r) => r.staff,
            options: ["Unassigned", "Staff User", "Anna Staff", "Mark Staff"],
          },
          {
            label: "Status",
            value: (r) => r.status,
            options: [
              "Pending",
              "Under Review",
              "Preparing",
              "Ready for Pickup",
              "Waiting for Booking",
              "Completed",
              "Cancelled",
            ],
          },
        ]}
      />
    </div>
  );
}
