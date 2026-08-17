import StaffPageHeader from "@/components/staff/StaffPageHeader";
import { DoughnutChart, LineChart } from "@/components/staff/reports/Charts";
const stats = [
  ["₱256,840", "Total Sales", "+12.6% vs previous period"],
  ["148", "Total Orders", "+8.4% vs previous period"],
  ["98", "Total Customers", "+10.3% vs previous period"],
  ["₱1,735", "Average Order Value", "+5.8% vs previous period"],
];
export default function Reports() {
  return (
    <div className="space-y-5">
      <StaffPageHeader
        eyebrow="Business Insights"
        title="Reports"
        description="Track sales, orders, customer activity, and fulfillment performance."
      >
        <select className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700">
          <option>This Month</option>
          <option>This Week</option>
          <option>This Year</option>
        </select>
      </StaffPageHeader>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(([value, label, support]) => (
          <article
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-3xl font-bold text-[#0B1930]">{value}</p>
            <h2 className="mt-1 font-semibold text-[#0B1930]">{label}</h2>
            <p className="mt-1 text-sm text-emerald-600">{support}</p>
          </article>
        ))}
      </section>
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(22rem,1fr)]">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-[#0B1930]">Sales Over Time</h2>
          <p className="mt-1 text-sm text-slate-500">
            Sales performance for the selected period.
          </p>
          <div className="mt-5 h-80">
            <LineChart />
          </div>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-[#0B1930]">Orders by Status</h2>
          <p className="mt-1 text-sm text-slate-500">
            Order distribution by current status.
          </p>
          <div className="mt-5 h-80">
            <DoughnutChart />
          </div>
        </article>
      </section>
      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {[
          [
            "Most Ordered Product",
            "Genuine Honda Brake Pad Set",
            "42 orders | ₱38,400 sales",
          ],
          [
            "Top Customer",
            "Miguel Ramos",
            "11 orders | ₱18,750 total order value",
          ],
          [
            "Most Used Fulfillment",
            "Store Pickup",
            "62% of completed orders | 38% Lalamove Delivery",
          ],
        ].map(([title, value, support]) => (
          <article
            key={title}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-semibold text-slate-500">{title}</p>
            <h2 className="mt-1 font-semibold text-[#0B1930]">{value}</h2>
            <p className="mt-1 text-sm text-slate-500">{support}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
