import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboardCheck, faClipboardList, faCreditCard, faStore, faTruck } from "@fortawesome/free-solid-svg-icons";

import { Badge } from "@/components/staff/PortalTable";
import StaffPageHeader from "@/components/staff/StaffPageHeader";
import { orders, products } from "@/lib/mock/staff";

const summary = [
  ["8", "Pending Orders", "Awaiting staff review", "â—·"],
  ["12", "Confirmed Orders", "Currently being processed", "âœ“"],
  ["3", "Payments to Verify", "Proof awaiting review", "â–£"],
  ["4", "Pickup Requests", "Orders requiring pickup action", "âŒ‚"],
  ["2", "Delivery Requests", "Lalamove actions required", "â™ž"],
  ["15", "Completed Today", "Orders successfully completed", "âœ“"],
];
const summaryIcons = { "Pending Orders": faClipboardList, "Confirmed Orders": faClipboardCheck, "Payments to Verify": faCreditCard, "Pickup Requests": faStore, "Delivery Requests": faTruck, "Completed Today": faClipboardCheck } as const;

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Good evening, Staff User"
        description="Here's what needs your attention at ALD Motorshop today."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="text-sm font-medium text-slate-500">
            â—· Sunday, August 16, 2026
          </p>
          <Link
            href="/staff/orders"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
          >
            View All Orders
          </Link>
        </div>
      </StaffPageHeader>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {summary.map(([value, label, description]) => (
          <article
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <span className="grid size-11 place-items-center rounded-lg bg-orange-50 text-lg text-orange-600">
                <FontAwesomeIcon icon={summaryIcons[label as keyof typeof summaryIcons]} />
              </span>
              <b className="text-3xl tracking-tight text-[#0B1930]">{value}</b>
            </div>
            <h2 className="mt-5 font-semibold text-[#0B1930]">{label}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-[#0B1930]">
              Recent Orders
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Latest customer order requests received by ALD Motorshop.
            </p>
          </div>
          <Link
            href="/staff/orders"
            className="text-sm font-semibold text-orange-600"
          >
            View All Orders â†’
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Reference",
                  "Customer",
                  "Request / Fulfillment",
                  "Status",
                  "Time",
                  "Action",
                ].map((column) => (
                  <th
                    key={column}
                    className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.slice(0, 5).map((order) => (
                <tr key={order.reference}>
                  <td className="px-6 py-4 text-sm font-semibold text-[#0B1930]">
                    {order.reference}
                  </td>
                  <td className="px-6 py-4 text-sm">{order.customer}</td>
                  <td className="px-6 py-4 text-sm">
                    <b className="block text-[#0B1930]">
                      {order.reference.endsWith("126")
                        ? "Honda Brake Pad Set"
                        : order.reference.endsWith("125")
                          ? "Yamaha Motorcycle Battery"
                          : "Motorcycle Parts"}
                    </b>
                    <span className="text-slate-500">{order.fulfillment}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge>{order.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    10 min ago
                  </td>
                  <td className="px-6 py-4">
                    <button className="rounded-lg border border-orange-400 px-3 py-1.5 text-xs font-semibold text-orange-600">
                      View Order
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <DashboardCard title="Today's Order Status">
          {[
            ["Pending", 8, "bg-orange-500"],
            ["Confirmed", 12, "bg-[#0B1930]"],
            ["Preparing", 7, "bg-blue-500"],
            ["Ready for Pickup", 4, "bg-emerald-500"],
            ["In Delivery", 2, "bg-violet-500"],
            ["Completed", 15, "bg-green-600"],
          ].map(([name, count, color]) => (
            <div key={name as string} className="flex items-center gap-3">
              <span className="w-28 text-sm text-slate-600">{name}</span>
              <span className="h-2 flex-1 rounded bg-slate-100">
                <i
                  className={`block h-2 rounded ${color}`}
                  style={{ width: `${(Number(count) / 15) * 100}%` }}
                />
              </span>
              <b className="w-5 text-right text-sm">{count}</b>
            </div>
          ))}
        </DashboardCard>

        <DashboardCard title="Payment Overview">
          {[
            ["Waiting for Verification", 3],
            ["Paid Today", 11],
            ["Unpaid Confirmed Orders", 5],
          ].map(([name, count]) => (
            <div
              key={name as string}
              className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0"
            >
              <span className="text-sm text-slate-600">{name}</span>
              <b className="text-[#0B1930]">{count}</b>
            </div>
          ))}
        </DashboardCard>

        <DashboardCard title="Product Alerts">
          {products.slice(0, 4).map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0"
            >
              <span className="max-w-40 truncate text-sm text-slate-700">
                {item.name}
              </span>
              <Badge>{item.availability}</Badge>
            </div>
          ))}
        </DashboardCard>
      </section>
    </div>
  );
}

function DashboardCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 font-semibold text-[#0B1930]">{title}</h2>
      <div className="space-y-3">{children}</div>
    </article>
  );
}
