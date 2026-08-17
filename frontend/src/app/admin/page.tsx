import Link from "next/link";
import { adminOrders } from "@/lib/mock/admin";
import { AdminBadge } from "@/components/admin/AdminDataTable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardList,
  faComments,
  faCreditCard,
  faTruck,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

type DashboardMetric = [
  value: string,
  label: string,
  description: string,
  icon: IconDefinition,
  tone: string,
];

const metrics: DashboardMetric[] = [
  [
    "48",
    "Total Orders",
    "8 pending review",
    faClipboardList,
    "bg-orange-50 text-orange-600",
  ],
  [
    "3",
    "Payments to Verify",
    "Awaiting verification",
    faCreditCard,
    "bg-emerald-50 text-emerald-700",
  ],
  [
    "6",
    "Active Fulfillment",
    "4 Pickup · 2 Delivery",
    faTruck,
    "bg-blue-50 text-blue-700",
  ],
  [
    "5",
    "New Inquiries",
    "Website customer messages",
    faComments,
    "bg-orange-50 text-orange-600",
  ],
];
const attention = [
  ["Payment Verification", "3 payments waiting for verification", "Review"],
  ["Pending Orders", "8 orders waiting for review", "View"],
  ["Product Availability", "8 products marked Low Stock", "View"],
  ["New Messages", "5 customer inquiries waiting", "View"],
  ["Staff Account", "1 staff account requires review", "Review"],
];
export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl">
            Good evening, Admin User
          </h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Here&apos;s a quick overview of ALD Motorshop operations today.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="text-sm font-medium text-slate-500">◷ August 8, 2026</p>
          <a
            href="#"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
          >
            ▥ View Reports
          </a>
        </div>
      </section>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([value, label, desc, icon, tone]) => (
          <article
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <span
                className={`grid size-11 place-items-center rounded-lg text-lg ${tone}`}
              >
                <FontAwesomeIcon icon={icon} aria-hidden="true" />
              </span>
              <div>
                <p className="text-3xl font-bold tracking-tight text-[#0B1930]">
                  {value}
                </p>
                <h3 className="mt-1 font-semibold text-[#0B1930]">{label}</h3>
                <p className="mt-1 text-sm text-slate-500">{desc}</p>
              </div>
            </div>
          </article>
        ))}
      </section>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-3">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-semibold text-[#0B1930]">
                Recent Orders
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest customer orders across ALD Motorshop.
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-sm font-semibold text-orange-600"
            >
              View All Orders →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Order",
                    "Customer",
                    "Branch",
                    "Amount",
                    "Fulfillment",
                    "Status",
                    "Action",
                  ].map((x) => (
                    <th
                      key={x}
                      className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adminOrders.slice(0, 5).map((x) => (
                  <tr key={x.reference}>
                    <td className="px-5 py-4 text-sm font-semibold text-[#0B1930]">
                      {x.reference}
                    </td>
                    <td className="px-5 py-4 text-sm">{x.customer}</td>
                    <td className="px-5 py-4 text-sm">{x.branch}</td>
                    <td className="px-5 py-4 text-sm font-semibold">
                      {x.amount}
                    </td>
                    <td className="px-5 py-4 text-sm">{x.fulfillment}</td>
                    <td className="px-5 py-4">
                      <AdminBadge>{x.status}</AdminBadge>
                    </td>
                    <td className="px-5 py-4">
                      <button className="rounded-lg border border-orange-300 px-3 py-1.5 text-xs font-semibold text-orange-600">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <DashboardList
          title="Needs Attention"
          description="Items that may require your review."
          rows={attention.map((x) => ({
            title: x[0],
            detail: x[1],
            action: x[2],
          }))}
        />
        <DashboardList
          title="Branch Overview"
          description="Current order activity by branch."
          rows={[
            {
              title: "Manila Branch",
              detail: "24 Orders · 8 Pickup · 6 Delivery",
              action: "›",
            },
            {
              title: "Makati Branch",
              detail: "15 Orders · 5 Pickup · 7 Delivery",
              action: "›",
            },
            {
              title: "Imus Branch",
              detail: "9 Orders · 3 Pickup · 1 Delivery",
              action: "›",
            },
          ]}
        />
        <DashboardList
          title="Recent Activity"
          description="Latest important changes in the system."
          rows={[
            {
              title: "Payment for ALD-2026-000119 verified",
              detail: "Admin User · 42 min ago",
              action: "",
            },
            {
              title: "ALD-2026-000125 marked Ready for Pickup",
              detail: "Staff User · 1 hr ago",
              action: "",
            },
            {
              title: "Yamaha Motorcycle Battery updated to Low Stock",
              detail: "Staff User · 1 hr ago",
              action: "",
            },
            {
              title: "Staff account activated for Makati Branch",
              detail: "Admin User · 2 hrs ago",
              action: "",
            },
          ]}
        />
      </div>
    </div>
  );
}
function DashboardList({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: { title: string; detail: string; action: string }[];
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <h2 className="text-lg font-semibold text-[#0B1930]">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div
            key={row.title}
            className="flex items-center gap-3 px-5 py-4 sm:px-6"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-orange-50 text-orange-600">
              ●
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-[#0B1930]">
                {row.title}
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {row.detail}
              </p>
            </div>
            {row.action && (
              <button className="shrink-0 text-sm font-semibold text-orange-600">
                {row.action}
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
