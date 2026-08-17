"use client";
import { useState } from "react";
import StaffPageHeader from "@/components/staff/StaffPageHeader";
import PortalTable, {
  Badge,
  type Column,
} from "@/components/staff/PortalTable";
type Payment = {
  order: string;
  customer: string;
  total: string;
  method: string;
  paid: string;
  status: string;
  date: string;
  reference: string;
};
const payments: Payment[] = [
  {
    order: "ALD-2026-000126",
    customer: "John Doe",
    total: "₱3,260",
    method: "Cash / Pay at Branch",
    paid: "—",
    status: "Pay at Pickup",
    date: "—",
    reference: "—",
  },
  {
    order: "ALD-2026-000124",
    customer: "Carla Mendoza",
    total: "₱2,470",
    method: "Online Payment",
    paid: "₱2,470",
    status: "Waiting for Verification",
    date: "Aug 7, 2026",
    reference: "PAY-873216",
  },
  {
    order: "ALD-2026-000123",
    customer: "Miguel Ramos",
    total: "₱1,680",
    method: "Online Payment",
    paid: "₱1,680",
    status: "Paid",
    date: "Aug 6, 2026",
    reference: "PAY-872944",
  },
  {
    order: "ALD-2026-000120",
    customer: "Grace Lopez",
    total: "₱1,250",
    method: "Online Payment",
    paid: "₱1,250",
    status: "Failed",
    date: "Aug 6, 2026",
    reference: "PAY-872601",
  },
  {
    order: "ALD-2026-000117",
    customer: "Daniel Reyes",
    total: "₱2,800",
    method: "Online Payment",
    paid: "₱2,800",
    status: "Refunded",
    date: "Aug 5, 2026",
    reference: "PAY-872288",
  },
];
export default function Payments() {
  const [selected, setSelected] = useState<Payment | null>(null);
  const cols: Column<Payment>[] = [
    {
      label: "Order",
      render: (r) => <b className="text-[#0B1930]">{r.order}</b>,
      search: (r) => r.order,
    },
    { label: "Customer", render: (r) => r.customer, search: (r) => r.customer },
    { label: "Total", render: (r) => <b>{r.total}</b> },
    { label: "Method", render: (r) => r.method, search: (r) => r.method },
    { label: "Amount Paid", render: (r) => r.paid },
    {
      label: "Status",
      render: (r) => <Badge>{r.status}</Badge>,
      search: (r) => r.status,
    },
    { label: "Payment Date", render: (r) => r.date },
    {
      label: "Action",
      render: (r) => (
        <button
          onClick={() => setSelected(r)}
          className="rounded-lg border border-orange-400 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50"
        >
          {r.status === "Waiting for Verification"
            ? "Review Payment"
            : "View Payment"}
        </button>
      ),
    },
  ];
  return (
    <div className="space-y-5">
      <StaffPageHeader
        eyebrow="Payment Management"
        title="Payments"
        description="Review online payment proof and monitor payment status."
      />
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["18", "Total Payments", "All payment records"],
          ["3", "Waiting for Verification", "Proof awaiting review"],
          ["11", "Paid", "Verified online payments"],
          ["5", "Pay at Pickup", "Cash at branch"],
        ].map(([value, label, detail]) => (
          <article
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <b className="text-3xl text-[#0B1930]">{value}</b>
            <h2 className="mt-1 font-semibold text-[#0B1930]">{label}</h2>
            <p className="mt-1 text-sm text-slate-500">{detail}</p>
          </article>
        ))}
      </section>
      <PortalTable
        title="Payment List"
        description="18 payment records"
        rows={payments}
        columns={cols}
        tabs={[
          "All",
          "Waiting for Verification",
          "Paid",
          "Pay at Pickup",
          "Failed",
          "Refunded",
        ]}
        tabValue={(r, t) => r.status === t}
      />
      {selected && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="font-semibold text-[#0B1930]">
                {selected.status === "Waiting for Verification"
                  ? "Review Payment"
                  : "Payment Details"}
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-xl text-slate-500"
              >
                ×
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <p className="text-slate-500">
                  Order <b className="block text-[#0B1930]">{selected.order}</b>
                </p>
                <p className="text-slate-500">
                  Customer{" "}
                  <b className="block text-[#0B1930]">{selected.customer}</b>
                </p>
                <p className="text-slate-500">
                  Amount <b className="block text-[#0B1930]">{selected.paid}</b>
                </p>
                <p className="text-slate-500">
                  Reference{" "}
                  <b className="block text-[#0B1930]">{selected.reference}</b>
                </p>
              </div>
              <div className="grid min-h-48 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500">
                Proof of payment preview
                <br />
                <span className="text-xs">Demo UI only</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
              >
                Close
              </button>
              {selected.status === "Waiting for Verification" && (
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  Verify Payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
