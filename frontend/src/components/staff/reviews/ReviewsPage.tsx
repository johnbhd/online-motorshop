"use client";

import ActionButton from "@/components/staff/ActionButton";
import PortalTable, {
  Badge,
  type Column,
} from "@/components/staff/PortalTable";
import StaffPageHeader from "@/components/staff/StaffPageHeader";
import Summary from "@/components/staff/Summary";
import { reviews, type Review } from "@/lib/mock/staff";

export default function ReviewsPage() {
  const columns: Column<Review>[] = [
    {
      label: "Customer",
      render: (row) => (
        <span>
          <b className="text-[#0B1930]">{row.customer}</b>
        </span>
      ),
      search: (row) => row.customer,
    },
    {
      label: "Product",
      render: (row) => row.product,
      search: (row) => row.product,
    },
    {
      label: "Rating",
      render: (row) => (
        <span className="text-orange-500">
          {"â˜…".repeat(row.rating)}
          <span className="text-slate-200">{"â˜…".repeat(5 - row.rating)}</span>
        </span>
      ),
    },
    {
      label: "Review",
      render: (row) => (
        <span className="block max-w-60 truncate">{row.review}</span>
      ),
      search: (row) => row.review,
    },
    {
      label: "Branch",
      render: (row) => row.branch,
      search: (row) => row.branch,
    },
    {
      label: "Status",
      render: (row) => <Badge>{row.status}</Badge>,
      search: (row) => row.status,
    },
    { label: "Date", render: (row) => row.date },
    { label: "Action", render: (row) => <ActionButton label={row.action} /> },
  ];

  return (
    <div className="space-y-5">
      <StaffPageHeader
        eyebrow="Review Monitoring"
        title="Customer Reviews"
        description="Monitor customer feedback, respond to reviews, and flag reviews that need Admin attention."
      />
      <Summary
        items={[
          ["86", "Total Reviews", "All customer reviews"],
          ["4.6", "Average Rating", "Out of 5 stars"],
          ["7", "Awaiting Reply", "Need staff response"],
          ["3", "Needs Admin Review", "Flagged or inappropriate"],
        ]}
      />
      <PortalTable
        title="Review List"
        description="86 customer reviews"
        rows={reviews}
        columns={columns}
        tabs={["All", "Published", "Pending Review", "Flagged", "Hidden"]}
        tabValue={(row, tab) => row.status === tab}
      />
    </div>
  );
}
