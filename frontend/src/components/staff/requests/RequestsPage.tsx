"use client";

import { Badge, type Column } from "@/components/staff/PortalTable";
import StaffPageHeader from "@/components/staff/StaffPageHeader";
import Summary, { type SummaryItem } from "@/components/staff/Summary";
import ActionButton from "@/components/staff/ActionButton";
import PortalTable from "@/components/staff/PortalTable";
import {
  deliveryRequests,
  pickupRequests,
  type Request,
} from "@/lib/mock/staff";

type RequestsPageProps = {
  type: "pickup" | "delivery";
};

export default function RequestsPage({ type }: RequestsPageProps) {
  const delivery = type === "delivery";
  const records = delivery ? deliveryRequests : pickupRequests;
  const columns: Column<Request>[] = [
    {
      label: "Order",
      render: (row) => <b className="text-[#0B1930]">{row.orderReference}</b>,
      search: (row) => row.orderReference,
    },
    {
      label: "Customer",
      render: (row) => row.customer,
      search: (row) => row.customer,
    },
    {
      label: "Branch",
      render: (row) => row.branch,
      search: (row) => row.branch,
    },
    ...(delivery
      ? [
          {
            label: "Destination",
            render: (row: Request) => row.destination ?? "â€”",
            search: (row: Request) => row.destination ?? "",
          },
        ]
      : []),
    { label: "Amount", render: (row) => <b>{row.amount}</b> },
    { label: "Payment", render: (row) => <Badge>{row.payment}</Badge> },
    {
      label: "Status",
      render: (row) => <Badge>{row.status}</Badge>,
      search: (row) => row.status,
    },
    { label: "Updated", render: (row) => row.updated },
    { label: "Action", render: (row) => <ActionButton label={row.action} /> },
  ];
  const title = delivery ? "Delivery Requests" : "Pickup Requests";
  const summary: SummaryItem[] = delivery
    ? [
        ["16", "Delivery Requests", "All delivery requests"],
        ["2", "Active Deliveries", "Booking or transit"],
        ["10", "Delivered", "Successfully delivered"],
        ["1", "Waiting for Booking", "Needs staff action"],
      ]
    : [
        ["18", "Pickup Requests", "All pickup orders"],
        ["4", "Active Pickups", "Preparing or ready"],
        ["2", "Preparing", "Currently being prepared"],
        ["12", "Completed", "Picked up successfully"],
      ];

  return (
    <div className="space-y-5">
      <StaffPageHeader
        eyebrow="Fulfillment"
        title={title}
        description={
          delivery
            ? "Manage Lalamove delivery requests and current delivery status."
            : "Prepare orders and coordinate customer store pickups."
        }
      />
      <Summary items={summary} />
      <PortalTable
        title={title}
        description={`${records.length} visible requests`}
        rows={records}
        columns={columns}
        tabs={[
          "All",
          "Preparing",
          "Ready for Pickup",
          "Waiting for Booking",
          "In Transit",
          "Completed",
          "Cancelled",
        ]}
        tabValue={(row, tab) => row.status === tab}
      />
    </div>
  );
}
