"use client";

import ActionButton from "@/components/staff/ActionButton";
import PortalTable, {
  Badge,
  type Column,
} from "@/components/staff/PortalTable";
import StaffPageHeader from "@/components/staff/StaffPageHeader";
import Summary from "@/components/staff/Summary";
import { products, type Product } from "@/lib/mock/staff";

export default function ProductsPage() {
  const columns: Column<Product>[] = [
    {
      label: "Product",
      render: (row) => (
        <span>
          <b className="block text-[#0B1930]">{row.name}</b>
          <small>{row.partNumber}</small>
        </span>
      ),
      search: (row) => `${row.name} ${row.partNumber}`,
    },
    { label: "Brand", render: (row) => row.brand, search: (row) => row.brand },
    {
      label: "Category",
      render: (row) => row.category,
      search: (row) => row.category,
    },
    { label: "Price", render: (row) => <b>{row.price}</b> },
    {
      label: "Availability",
      render: (row) => <Badge>{row.availability}</Badge>,
      search: (row) => row.availability,
    },
    { label: "Updated", render: (row) => row.updated },
    { label: "Action", render: (row) => <ActionButton label={row.action} /> },
  ];

  return (
    <div className="space-y-5">
      <StaffPageHeader
        eyebrow="Catalog"
        title="Products"
        description="Review product availability and update catalog status."
      />
      <Summary
        items={[
          ["86", "Total Products", "Products in catalog"],
          ["52", "Available", "Ready to order"],
          ["8", "Low Stock", "Needs attention"],
          ["7", "Out of Stock", "Unavailable products"],
        ]}
      />
      <PortalTable
        title="Product List"
        description="86 products in catalog"
        rows={products}
        columns={columns}
        tabs={[
          "All",
          "Available",
          "Low Stock",
          "Subject to Confirmation",
          "Out of Stock",
        ]}
        tabValue={(row, tab) => row.availability === tab}
      />
    </div>
  );
}
