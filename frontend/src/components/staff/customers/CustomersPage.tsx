"use client";

import ActionButton from "@/components/staff/ActionButton";
import PortalTable, {
  Badge,
  type Column,
} from "@/components/staff/PortalTable";
import StaffPageHeader from "@/components/staff/StaffPageHeader";
import Summary from "@/components/staff/Summary";
import { customers, type Customer } from "@/lib/mock/staff";

export default function CustomersPage() {
  const columns: Column<Customer>[] = [
    {
      label: "Customer",
      render: (row) => (
        <span className="flex items-center gap-3">
          <i className="grid size-9 place-items-center rounded-full bg-slate-100 text-xs not-italic font-bold">
            {row.initials}
          </i>
          <span>
            <b className="block text-[#0B1930]">{row.name}</b>
            <small>{row.email}</small>
          </span>
        </span>
      ),
      search: (row) => `${row.name} ${row.email}`,
    },
    {
      label: "Type",
      render: (row) => <Badge>{row.type}</Badge>,
      search: (row) => row.type,
    },
    { label: "Contact", render: (row) => row.contact },
    {
      label: "Branch",
      render: (row) => row.branch,
      search: (row) => row.branch,
    },
    { label: "Orders", render: (row) => row.orders },
    { label: "Active Orders", render: (row) => row.activeOrders },
    { label: "Last Order", render: (row) => row.lastOrder },
    { label: "Action", render: () => <ActionButton label="View Customer" /> },
  ];

  return (
    <div className="space-y-5">
      <StaffPageHeader
        eyebrow="Customer Directory"
        title="Customers"
        description="Review customer records and current ordering activity."
      />
      <Summary
        items={[
          ["124", "Total Customers", "All customer records"],
          ["47", "Registered", "Customer accounts"],
          ["77", "Guest", "Guest checkouts"],
          ["18", "Active Orders", "Current order activity"],
        ]}
      />
      <PortalTable
        title="Customer List"
        description="124 customer records"
        rows={customers}
        columns={columns}
        tabs={["All", "Registered", "Guest"]}
        tabValue={(row, tab) => row.type === tab}
      />
    </div>
  );
}
