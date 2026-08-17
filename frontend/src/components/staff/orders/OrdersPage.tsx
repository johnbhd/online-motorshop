"use client";

import ActionButton from "@/components/staff/ActionButton";
import PortalTable, {
  Badge,
  type Column,
} from "@/components/staff/PortalTable";
import StaffPageHeader from "@/components/staff/StaffPageHeader";
import Summary from "@/components/staff/Summary";
import { orders, type Order } from "@/lib/mock/staff";

export default function OrdersPage() {
  const columns: Column<Order>[] = [
    {
      label: "Reference",
      render: (row) => <b className="text-[#0B1930]">{row.reference}</b>,
      search: (row) => row.reference,
    },
    {
      label: "Customer",
      render: (row) => row.customer,
      search: (row) => row.customer,
    },
    { label: "Date", render: (row) => row.date },
    { label: "Amount", render: (row) => <b>{row.amount}</b> },
    {
      label: "Fulfillment",
      render: (row) => row.fulfillment,
      search: (row) => row.fulfillment,
    },
    {
      label: "Payment",
      render: (row) => <Badge>{row.payment}</Badge>,
      search: (row) => row.payment,
    },
    {
      label: "Status",
      render: (row) => <Badge>{row.status}</Badge>,
      search: (row) => row.status,
    },
    { label: "Action", render: (row) => <ActionButton label={row.action} /> },
  ];

  return (
    <div className="space-y-5">
      <StaffPageHeader
        eyebrow="Order Management"
        title="Orders"
        description="Review and manage customer order requests."
      />
      <Summary
        items={[
          ["48", "Total Orders", "All received orders"],
          ["8", "Pending Orders", "Awaiting staff review"],
          ["12", "Confirmed Orders", "Currently processing"],
          ["15", "Completed", "Completed today"],
        ]}
      />
      <PortalTable
        title="Order List"
        description="48 customer order requests"
        rows={orders}
        columns={columns}
        tabs={[
          "All",
          "Pending",
          "Preparing",
          "Ready for Pickup",
          "Delivery",
          "Completed",
          "Cancelled",
        ]}
        tabValue={(row, tab) =>
          tab === "Preparing"
            ? row.status === "Preparing Order"
            : row.status === tab
        }
      />
    </div>
  );
}
