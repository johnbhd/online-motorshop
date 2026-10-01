"use client";
import { useMemo, useState } from "react";
import AdminDataTable, { AdminBadge } from "./AdminDataTable";
import PaymentDetailsModal, {
  type PaymentModalMode,
} from "./payments/PaymentDetailsModal";
import PickupRequestDetailsModal, {
  type PickupModalMode,
} from "./pickup-requests/PickupRequestDetailsModal";
import DeliveryRequestDetailsModal, {
  type DeliveryModalMode,
} from "./delivery-requests/DeliveryRequestDetailsModal";
import type { Column } from "@/components/staff/PortalTable";
import {
  adminPayments,
  adminPickups,
  adminDeliveries,
  adminProducts,
  productCategories,
  productBrands,
  motorcycleModels,
  type AdminPayment,
  type AdminPickup,
  type AdminDelivery,
  type AdminProduct,
} from "@/lib/mock/admin";
const action = (text: string) => (
  <button className="rounded-lg border border-orange-400 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50">
    {text}
  </button>
);
const heading = (
  eyebrow: string,
  title: string,
  description: string,
  attention?: string,
) => (
  <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
    <div>
      <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl">
        {title}
      </h2>
      <p className="mt-2 text-sm text-slate-600 sm:text-base">{description}</p>
    </div>
    {attention && (
      <p className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-800">
        {attention}
      </p>
    )}
  </section>
);
const metrics = (items: [string, string, string][]) => (
  <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
    {items.map(([value, label, detail]) => (
      <article
        key={label}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <p className="text-3xl font-bold tracking-tight text-[#0B1930]">
          {value}
        </p>
        <h3 className="mt-1 font-semibold text-[#0B1930]">{label}</h3>
        <p className="mt-1 text-sm text-slate-500">{detail}</p>
      </article>
    ))}
  </section>
);
export function PaymentsPage() {
  const [payments, setPayments] = useState(adminPayments);
  const [selectedPayment, setSelectedPayment] =
    useState<AdminPayment | null>(null);
  const [paymentModalMode, setPaymentModalMode] =
    useState<PaymentModalMode>("view");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const openPaymentModal = (
    payment: AdminPayment,
    mode: PaymentModalMode,
  ) => {
    setSelectedPayment(payment);
    setPaymentModalMode(mode);
    setIsPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedPayment(null);
  };

  const updatePaymentStatus = (orderId: string, status: string) => {
    setPayments((currentPayments) =>
      currentPayments.map((payment) =>
        payment.order === orderId
          ? {
              ...payment,
              status,
              verifiedBy: "Admin User",
              action: "View",
            }
          : payment,
      ),
    );
    closePaymentModal();
  };

  const c: Column<AdminPayment>[] = [
    {
      label: "Order",
      render: (r) => <b className="text-[#0B1930]">{r.order}</b>,
      search: (r) => r.order,
    },
    { label: "Customer", render: (r) => r.customer, search: (r) => r.customer },
    { label: "Branch", render: (r) => r.branch, search: (r) => r.branch },
    { label: "Order Total", render: (r) => <b>{r.total}</b> },
    { label: "Method", render: (r) => r.method, search: (r) => r.method },
    { label: "Amount Paid", render: (r) => r.paid },
    {
      label: "Status",
      render: (r) => <AdminBadge>{r.status}</AdminBadge>,
      search: (r) => r.status,
    },
    {
      label: "Verified By",
      render: (r) => r.verifiedBy,
      search: (r) => r.verifiedBy,
    },
    { label: "Payment Date", render: (r) => r.date },
    {
      label: "Action",
      render: (payment) => {
        const mode: PaymentModalMode =
          payment.action === "Review" ? "review" : "view";

        return (
          <button
            className="rounded-lg border border-orange-400 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50"
            type="button"
            onClick={() => openPaymentModal(payment, mode)}
          >
            {mode === "review" ? "Review" : "View"}
          </button>
        );
      },
    },
  ];
  return (
    <div className="space-y-5">
      {heading(
        "Payment Management",
        "Customer Payments",
        "Review payment records, verification status, and refunds across all branches.",
        "▣ 3 payments need verification",
      )}
      {metrics([
        ["41", "Payment Records", "All payment records"],
        ["36", "Paid", "Verified payments"],
        ["3", "Verifications Queue", "Awaiting review"],
        ["2", "Refunds / Failed", "Needs attention"],
      ])}
      <AdminDataTable
        title="Payment Records"
        description="41 customer payment records"
        rows={payments}
        columns={c}
        tabs={[
          "All",
          "Waiting for Verification",
          "Paid",
          "Unpaid",
          "Waiting for Payment",
          "Failed",
          "Refunded",
          "Cancelled",
        ]}
        matchTab={(r, t) => r.status === t}
        filters={[
          {
            label: "Branch",
            value: (r) => r.branch,
            options: ["Manila", "Makati", "Imus"],
          },
          {
            label: "Method",
            value: (r) => r.method,
            options: ["Online Payment", "Cash / Pay at Branch"],
          },
          {
            label: "Status",
            value: (r) => r.status,
            options: [
              "Waiting for Verification",
              "Paid",
              "Unpaid",
              "Failed",
              "Refunded",
              "Cancelled",
            ],
          },
        ]}
      />
      <PaymentDetailsModal
        key={selectedPayment?.order ?? "closed"}
        isOpen={isPaymentModalOpen}
        mode={paymentModalMode}
        payment={selectedPayment}
        onClose={closePaymentModal}
        onVerify={(orderId) => updatePaymentStatus(orderId, "Paid")}
        onReject={(orderId) => updatePaymentStatus(orderId, "Failed")}
      />
    </div>
  );
}
export function PickupsPage() {
  const [pickups, setPickups] = useState(adminPickups);
  const [selectedPickupOrder, setSelectedPickupOrder] = useState<string | null>(
    null,
  );
  const [pickupModalMode, setPickupModalMode] =
    useState<PickupModalMode>("view");
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const selectedPickupRequest =
    pickups.find((pickup) => pickup.order === selectedPickupOrder) ?? null;

  const openPickupModal = (pickup: AdminPickup, mode: PickupModalMode) => {
    setSelectedPickupOrder(pickup.order);
    setPickupModalMode(mode);
    setIsPickupModalOpen(true);
  };

  const closePickupModal = () => {
    setIsPickupModalOpen(false);
    setSelectedPickupOrder(null);
  };

  const updatePickup = (orderId: string, changes: Partial<AdminPickup>) => {
    setPickups((currentPickups) =>
      currentPickups.map((pickup) =>
        pickup.order === orderId ? { ...pickup, ...changes } : pickup,
      ),
    );
  };

  const assignPickupStaff = (orderId: string, staff: string) => {
    updatePickup(orderId, { staff });
  };

  const markPickupReady = (orderId: string) => {
    updatePickup(orderId, { status: "Ready for Pickup" });
    closePickupModal();
  };

  const cancelPickup = (orderId: string) => {
    updatePickup(orderId, { status: "Cancelled" });
    closePickupModal();
  };

  const c: Column<AdminPickup>[] = [
    {
      label: "Order",
      render: (r) => <b className="text-[#0B1930]">{r.order}</b>,
      search: (r) => r.order,
    },
    { label: "Customer", render: (r) => r.customer, search: (r) => r.customer },
    { label: "Branch", render: (r) => r.branch, search: (r) => r.branch },
    { label: "Pickup Schedule", render: (r) => r.schedule },
    { label: "Amount", render: (r) => <b>{r.amount}</b> },
    {
      label: "Payment",
      render: (r) => <AdminBadge>{r.payment}</AdminBadge>,
      search: (r) => r.payment,
    },
    { label: "Assigned Staff", render: (r) => r.staff, search: (r) => r.staff },
    {
      label: "Status",
      render: (r) => <AdminBadge>{r.status}</AdminBadge>,
      search: (r) => r.status,
    },
    {
      label: "Action",
      render: (pickup) => {
        const mode: PickupModalMode =
          pickup.status === "Preparing" ? "review" : "view";

        return (
          <button
            className="rounded-lg border border-orange-400 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50"
            type="button"
            onClick={() => openPickupModal(pickup, mode)}
          >
            {mode === "review" ? "Review" : "View"}
          </button>
        );
      },
    },
  ];
  return (
    <div className="space-y-5">
      {heading(
        "Fulfillment",
        "Store Pickup Requests",
        "Manage pickup schedules, staff assignments, and completion across all branches.",
        "⌂ 4 active pickup requests",
      )}
      {metrics([
        ["4", "Active Pickups", "Preparing or ready"],
        ["2", "Ready for Pickup", "Awaiting customer"],
        ["6", "Completed Today", "Picked up today"],
        ["22", "Total Requests", "All pickup requests"],
      ])}
      <AdminDataTable
        title="Pickup Request List"
        description="22 store pickup requests"
        rows={pickups}
        columns={c}
        tabs={[
          "All",
          "Preparing",
          "Ready for Pickup",
          "Completed",
          "Cancelled",
        ]}
        matchTab={(r, t) => r.status === t}
        filters={[
          {
            label: "Branch",
            value: (r) => r.branch,
            options: ["Manila", "Makati", "Imus"],
          },
          {
            label: "Staff",
            value: (r) => r.staff,
            options: ["Staff User", "Anna Staff", "Mark Staff", "—"],
          },
          {
            label: "Status",
            value: (r) => r.status,
            options: [
              "Preparing",
              "Ready for Pickup",
              "Completed",
              "Cancelled",
            ],
          },
        ]}
      />
      <BranchSummary
        title="Pickup Requests by Branch"
        rows={[
          ["Manila Branch", "9", "2 Active · 7 Completed"],
          ["Makati Branch", "7", "1 Active · 6 Completed"],
          ["Imus Branch", "6", "1 Active · 5 Completed"],
        ]}
      />
      <PickupRequestDetailsModal
        key={selectedPickupRequest?.order ?? "closed"}
        isOpen={isPickupModalOpen}
        mode={pickupModalMode}
        pickupRequest={selectedPickupRequest}
        onClose={closePickupModal}
        onAssignStaff={assignPickupStaff}
        onMarkReady={markPickupReady}
        onCancel={cancelPickup}
      />
    </div>
  );
}
export function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState(adminDeliveries);
  const [selectedDeliveryOrder, setSelectedDeliveryOrder] = useState<
    string | null
  >(null);
  const [deliveryModalMode, setDeliveryModalMode] =
    useState<DeliveryModalMode>("view");
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const selectedDeliveryRequest =
    deliveries.find((delivery) => delivery.order === selectedDeliveryOrder) ??
    null;

  const openDeliveryModal = (
    delivery: AdminDelivery,
    mode: DeliveryModalMode,
  ) => {
    setSelectedDeliveryOrder(delivery.order);
    setDeliveryModalMode(mode);
    setIsDeliveryModalOpen(true);
  };

  const closeDeliveryModal = () => {
    setIsDeliveryModalOpen(false);
    setSelectedDeliveryOrder(null);
  };

  const updateDelivery = (
    orderId: string,
    changes: Partial<AdminDelivery>,
  ) => {
    setDeliveries((currentDeliveries) =>
      currentDeliveries.map((delivery) =>
        delivery.order === orderId ? { ...delivery, ...changes } : delivery,
      ),
    );
  };

  const assignDeliveryStaff = (orderId: string, staff: string) => {
    updateDelivery(orderId, { staff });
  };

  const markDeliveryBooked = (orderId: string) => {
    updateDelivery(orderId, { status: "Booked", action: "View" });
    closeDeliveryModal();
  };

  const cancelDelivery = (orderId: string) => {
    updateDelivery(orderId, { status: "Cancelled", action: "View" });
    closeDeliveryModal();
  };

  const c: Column<AdminDelivery>[] = [
    {
      label: "Order",
      render: (r) => <b className="text-[#0B1930]">{r.order}</b>,
      search: (r) => r.order,
    },
    { label: "Customer", render: (r) => r.customer, search: (r) => r.customer },
    {
      label: "Destination",
      render: (r) => r.destination,
      search: (r) => r.destination,
    },
    { label: "Branch", render: (r) => r.branch, search: (r) => r.branch },
    { label: "Amount", render: (r) => <b>{r.amount}</b> },
    { label: "Lalamove Fee", render: (r) => r.fee },
    { label: "Assigned Staff", render: (r) => r.staff, search: (r) => r.staff },
    {
      label: "Status",
      render: (r) => <AdminBadge>{r.status}</AdminBadge>,
      search: (r) => r.status,
    },
    {
      label: "Action",
      render: (delivery) => {
        const mode: DeliveryModalMode =
          delivery.action === "View" ? "view" : "review";

        return (
          <button
            className="rounded-lg border border-orange-400 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50"
            type="button"
            onClick={() => openDeliveryModal(delivery, mode)}
          >
            {mode === "review" ? "Review" : "View"}
          </button>
        );
      },
    },
  ];
  return (
    <div className="space-y-5">
      {heading(
        "Fulfillment",
        "Lalamove Delivery Requests",
        "Manage Lalamove delivery requests and current delivery status.",
        "♞ 2 active deliveries",
      )}
      {metrics([
        ["2", "Active Deliveries", "Booking or in transit"],
        ["1", "Waiting for Booking", "Needs staff action"],
        ["5", "Delivered Today", "Successful deliveries"],
        ["20", "Total Requests", "All delivery requests"],
      ])}
      <AdminDataTable
        title="Delivery Request List"
        description="20 Lalamove delivery requests"
        rows={deliveries}
        columns={c}
        tabs={[
          "All",
          "Waiting for Booking",
          "Booked",
          "Picked Up",
          "In Transit",
          "Delivered",
          "Failed",
          "Cancelled",
        ]}
        matchTab={(r, t) => r.status === t}
        filters={[
          {
            label: "Branch",
            value: (r) => r.branch,
            options: ["Manila", "Makati", "Imus"],
          },
          {
            label: "Staff",
            value: (r) => r.staff,
            options: ["Staff User", "Anna Staff", "Mark Staff", "—"],
          },
          {
            label: "Status",
            value: (r) => r.status,
            options: [
              "Waiting for Booking",
              "Booked",
              "Picked Up",
              "In Transit",
              "Delivered",
              "Failed",
              "Cancelled",
            ],
          },
        ]}
      />
      <BranchSummary
        title="Delivery by Branch"
        rows={[
          ["Manila Branch", "8", "1 Active · 7 Delivered"],
          ["Makati Branch", "7", "1 Active · 6 Delivered"],
          ["Imus Branch", "5", "0 Active · 5 Delivered"],
        ]}
      />
      <DeliveryRequestDetailsModal
        key={selectedDeliveryRequest?.order ?? "closed"}
        isOpen={isDeliveryModalOpen}
        mode={deliveryModalMode}
        deliveryRequest={selectedDeliveryRequest}
        onClose={closeDeliveryModal}
        onAssignStaff={assignDeliveryStaff}
        onMarkBooked={markDeliveryBooked}
        onCancel={cancelDelivery}
      />
    </div>
  );
}
export function ProductsPage() {
  const [main, setMain] = useState("Products");
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("All");
  const [availability, setAvailability] = useState("All");
  const filtered = useMemo(
    () =>
      adminProducts.filter(
        (p) =>
          `${p.name} ${p.partNumber}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (brand === "All" || p.brand === brand) &&
          (availability === "All" || p.availability === availability),
      ),
    [query, brand, availability],
  );
  const columns: Column<AdminProduct>[] = [
    {
      label: "Product",
      render: (r) => (
        <span className="flex items-center gap-3">
          <i className="grid size-9 place-items-center rounded-lg bg-slate-100 not-italic text-slate-400">
            □
          </i>
          <b className="text-[#0B1930]">{r.name}</b>
        </span>
      ),
      search: (r) => `${r.name} ${r.partNumber}`,
    },
    { label: "Part Number", render: (r) => r.partNumber },
    { label: "Brand", render: (r) => r.brand, search: (r) => r.brand },
    { label: "Category", render: (r) => r.category, search: (r) => r.category },
    { label: "Price", render: (r) => <b>{r.price}</b> },
    {
      label: "Availability",
      render: (r) => <AdminBadge>{r.availability}</AdminBadge>,
      search: (r) => r.availability,
    },
    {
      label: "Status",
      render: (r) => <AdminBadge>{r.status}</AdminBadge>,
      search: (r) => r.status,
    },
    { label: "Updated", render: (r) => r.updated },
    { label: "Action", render: () => action("Manage") },
  ];
  return (
    <div className="space-y-5">
      {heading(
        "Catalog Management",
        "Products",
        "Manage motorcycle products, categories, brands, and compatibility.",
        "□ 8 products need attention",
      )}
      {metrics([
        ["86", "Total Products", "Products in catalog"],
        ["52", "Available", "Ready to order"],
        ["18", "Needs Attention", "Low stock or unavailable"],
        ["7", "Out of Stock", "Unavailable products"],
      ])}
      <section className="rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
        <div className="flex gap-6 overflow-x-auto">
          <button
            onClick={() => setMain("Products")}
            className={`min-h-14 border-b-2 text-sm font-semibold ${main === "Products" ? "border-orange-500 text-[#0B1930]" : "border-transparent text-slate-500"}`}
          >
            Products
          </button>
          <button
            onClick={() => setMain("Categories & Brands")}
            className={`min-h-14 border-b-2 text-sm font-semibold ${main === "Categories & Brands" ? "border-orange-500 text-[#0B1930]" : "border-transparent text-slate-500"}`}
          >
            Categories & Brands
          </button>
          <button
            onClick={() => setMain("Compatibility")}
            className={`min-h-14 border-b-2 text-sm font-semibold ${main === "Compatibility" ? "border-orange-500 text-[#0B1930]" : "border-transparent text-slate-500"}`}
          >
            Compatibility
          </button>
        </div>
      </section>
      {main === "Products" && (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search product or part number"
                className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm"
              />
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm"
              >
                <option>All</option>
                <option>Honda</option>
                <option>Yamaha</option>
                <option>Suzuki</option>
                <option>Universal</option>
              </select>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm"
              >
                <option>All</option>
                <option>Available</option>
                <option>Low Stock</option>
                <option>Subject to Confirmation</option>
                <option>Out of Stock</option>
              </select>
            </div>
          </section>
          <ProductTable rows={filtered} columns={columns} />
        </>
      )}
      {main === "Categories & Brands" && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Management title="Categories" rows={productCategories} />
          <Management title="Brands" rows={productBrands} />
        </div>
      )}
      {main === "Compatibility" && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
            <div>
              <h2 className="text-lg font-semibold text-[#0B1930]">
                Motorcycle Models & Compatibility
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Manage motorcycle models and compatible parts.
              </p>
            </div>
            <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
              + Add Motorcycle Model
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Model",
                    "Brand",
                    "Year / Series",
                    "Compatible Products",
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
                {motorcycleModels.map((row) => (
                  <tr key={row.model}>
                    <td className="px-5 py-3.5 font-semibold text-[#0B1930]">
                      {row.model}
                    </td>
                    <td className="px-5 py-3.5 text-sm">{row.brand}</td>
                    <td className="px-5 py-3.5 text-sm">{row.series}</td>
                    <td className="px-5 py-3.5 text-sm">
                      {row.compatible} compatible products
                    </td>
                    <td className="px-5 py-3.5">
                      <AdminBadge>{row.status}</AdminBadge>
                    </td>
                    <td className="px-5 py-3.5">{action("Manage")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
function ProductTable({
  rows,
  columns,
}: {
  rows: AdminProduct[];
  columns: Column<AdminProduct>[];
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
        <div>
          <h2 className="text-lg font-semibold text-[#0B1930]">Product List</h2>
          <p className="mt-1 text-sm text-slate-500">
            {rows.length} motorcycle products
          </p>
        </div>
        <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
          + Add Product
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1150px] text-left">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.label}
                  className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.partNumber}>
                {columns.map((c) => (
                  <td
                    key={c.label}
                    className="px-5 py-3.5 text-sm text-slate-600"
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
function Management({
  title,
  rows,
}: {
  title: string;
  rows: { name: string; products: number; status: string }[];
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
        <h2 className="text-lg font-semibold text-[#0B1930]">{title}</h2>
        <button className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white">
          + Add {title.slice(0, -1)}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[430px] text-left">
          <thead className="bg-slate-50">
            <tr>
              {[title.slice(0, -1), "Products", "Status", "Action"].map((x) => (
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
            {rows.map((row) => (
              <tr key={row.name}>
                <td className="px-5 py-3.5 text-sm font-semibold text-[#0B1930]">
                  {row.name}
                </td>
                <td className="px-5 py-3.5 text-sm">{row.products}</td>
                <td className="px-5 py-3.5">
                  <AdminBadge>{row.status}</AdminBadge>
                </td>
                <td className="px-5 py-3.5">{action("Manage")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
function BranchSummary({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-5">
        <h2 className="text-lg font-semibold text-[#0B1930]">{title}</h2>
      </div>
      <div className="grid divide-y divide-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0">
        {rows.map(([branch, count, detail]) => (
          <div key={branch} className="p-5">
            <p className="font-semibold text-[#0B1930]">{branch}</p>
            <p className="mt-2 text-2xl font-bold text-orange-600">{count}</p>
            <p className="mt-1 text-sm text-slate-500">{detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
