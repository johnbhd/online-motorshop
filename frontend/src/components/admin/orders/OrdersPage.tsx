"use client";
import { useCallback, useState } from "react";
import AdminDataTable, { AdminBadge } from "@/components/admin/AdminDataTable";
import type { Column } from "@/components/staff/PortalTable";
import { adminOrders, type AdminOrder } from "@/lib/mock/admin";
import OrderDetailsModal, {
  type OrderModalMode,
} from "./OrderDetailsModal";
import type { OrderUpdateDraft } from "./orderDetails";

export default function Orders() {
  const [orders, setOrders] = useState(adminOrders);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [modalMode, setModalMode] = useState<OrderModalMode>("view");
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const openOrderModal = useCallback(
    (order: AdminOrder, mode: OrderModalMode) => {
      setSelectedOrder(order);
      setModalMode(mode);
      setIsOrderModalOpen(true);
    },
    [],
  );

  const closeOrderModal = useCallback(() => {
    setIsOrderModalOpen(false);
    setSelectedOrder(null);
  }, []);

  const applyOrderChanges = useCallback(
    (reference: string, changes: OrderUpdateDraft) => {
      const updateOrder = (order: AdminOrder): AdminOrder =>
        order.reference === reference
          ? {
              ...order,
              status: changes.status,
              staff: changes.staff,
              fulfillment: changes.fulfillment,
              action: changes.status === "Pending" ? "Review" : "View",
            }
          : order;

      setOrders((currentOrders) => currentOrders.map(updateOrder));
      closeOrderModal();
    },
    [closeOrderModal],
  );

  const confirmOrder = useCallback(
    (reference: string) => {
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.reference === reference
            ? { ...order, status: "Under Review", action: "View" }
            : order,
        ),
      );
      closeOrderModal();
    },
    [closeOrderModal],
  );

  const rejectOrder = useCallback(
    (reference: string) => {
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.reference === reference
            ? { ...order, status: "Cancelled", action: "View" }
            : order,
        ),
      );
      closeOrderModal();
    },
    [closeOrderModal],
  );

  const columns: Column<AdminOrder>[] = [
    {
      label: "Order",
      render: (order) => (
        <b className="text-[#0B1930]">{order.reference}</b>
      ),
      search: (order) => order.reference,
    },
    {
      label: "Customer",
      render: (order) => order.customer,
      search: (order) => order.customer,
    },
    {
      label: "Branch",
      render: (order) => order.branch,
      search: (order) => order.branch,
    },
    { label: "Amount", render: (order) => <b>{order.amount}</b> },
    {
      label: "Fulfillment",
      render: (order) => order.fulfillment,
      search: (order) => order.fulfillment,
    },
    {
      label: "Assigned Staff",
      render: (order) => order.staff,
      search: (order) => order.staff,
    },
    {
      label: "Status",
      render: (order) => <AdminBadge>{order.status}</AdminBadge>,
      search: (order) => order.status,
    },
    { label: "Updated", render: (order) => order.updated },
    {
      label: "Action",
      render: (order) => {
        const mode: OrderModalMode =
          order.status === "Pending" ? "review" : "view";

        return (
          <button
            className="rounded-lg border border-orange-400 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50"
            type="button"
            onClick={() => openOrderModal(order, mode)}
          >
            {mode === "review" ? "Review" : "View"}
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">
            Order Management
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl">
            All Customer Orders
          </h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Review, assign, and manage customer orders across all ALD Motorshop
            branches.
          </p>
        </div>
        <p className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-800">
          ◷ <b>8</b> orders need review
        </p>
      </section>
      <AdminDataTable
        title="Order List"
        description={`${orders.length} customer order records`}
        rows={orders}
        columns={columns}
        tabs={[
          "All",
          "Pending",
          "Under Review",
          "Preparing",
          "Ready for Pickup",
          "Waiting for Booking",
          "In Transit",
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
            label: "Fulfillment",
            value: (r) => r.fulfillment,
            options: ["Store Pickup", "Lalamove Delivery"],
          },
          {
            label: "Assigned staff",
            value: (r) => r.staff,
            options: ["Unassigned", "Staff User", "Anna Staff", "Mark Staff"],
          },
          {
            label: "Status",
            value: (r) => r.status,
            options: [
              "Pending",
              "Under Review",
              "Preparing",
              "Ready for Pickup",
              "Waiting for Booking",
              "Completed",
              "Cancelled",
            ],
          },
        ]}
      />
      <OrderDetailsModal
        key={selectedOrder?.reference ?? "closed"}
        isOpen={isOrderModalOpen}
        mode={modalMode}
        order={selectedOrder}
        onClose={closeOrderModal}
        onConfirm={confirmOrder}
        onReject={rejectOrder}
        onSave={applyOrderChanges}
      />
    </div>
  );
}
