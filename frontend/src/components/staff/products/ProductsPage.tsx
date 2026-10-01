"use client";

import { useCallback, useState } from "react";
import ActionButton from "@/components/staff/ActionButton";
import PortalTable, {
  Badge,
  type Column,
} from "@/components/staff/PortalTable";
import StaffPageHeader from "@/components/staff/StaffPageHeader";
import Summary from "@/components/staff/Summary";
import StaffProductAvailabilityModal, {
  type ProductAvailability,
} from "./StaffProductAvailabilityModal";
import StaffProductDetailsModal from "./StaffProductDetailsModal";
import { products, type Product } from "@/lib/mock/staff";

export default function ProductsPage() {
  const [productRows, setProductRows] = useState<Product[]>(products);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    null,
  );
  const [productModal, setProductModal] = useState<
    "details" | "availability" | null
  >(null);

  const openProductDetails = useCallback((product: Product) => {
    setSelectedProduct(product);
    setProductModal("details");
  }, []);

  const openAvailabilityModal = useCallback((product: Product) => {
    setSelectedProduct(product);
    setProductModal("availability");
  }, []);

  const closeProductModal = useCallback(() => {
    setProductModal(null);
    setSelectedProduct(null);
  }, []);

  const updateAvailability = useCallback(
    (partNumber: string, availability: ProductAvailability) => {
      setProductRows((currentProducts) =>
        currentProducts.map((product) =>
          product.partNumber === partNumber
            ? {
                ...product,
                availability,
                action:
                  availability === "Available"
                    ? "View Product"
                    : "Update Status",
              }
            : product,
        ),
      );
      closeProductModal();
    },
    [closeProductModal],
  );

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
    {
      label: "Action",
      render: (row) => (
        <ActionButton
          label={row.action}
          onClick={() => {
            if (row.action === "View Product") {
              openProductDetails(row);
              return;
            }

            openAvailabilityModal(row);
          }}
        />
      ),
    },
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
        rows={productRows}
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
      <StaffProductDetailsModal
        key={`details-${selectedProduct?.partNumber ?? "closed"}`}
        isOpen={productModal === "details"}
        product={selectedProduct}
        onClose={closeProductModal}
      />
      <StaffProductAvailabilityModal
        key={`availability-${selectedProduct?.partNumber ?? "closed"}`}
        isOpen={productModal === "availability"}
        product={selectedProduct}
        onClose={closeProductModal}
        onUpdateAvailability={updateAvailability}
      />
    </div>
  );
}
