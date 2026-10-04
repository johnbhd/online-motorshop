"use client";

import { useCallback, useMemo, useState } from "react";
import { Badge, type Column } from "@/components/staff/PortalTable";
import StaffPageHeader from "@/components/staff/StaffPageHeader";
import Summary, { type SummaryItem } from "@/components/staff/Summary";
import ActionButton from "@/components/staff/ActionButton";
import PortalTable from "@/components/staff/PortalTable";
import StaffDeliveryRequestDetailsModal from "@/components/staff/delivery-requests/StaffDeliveryRequestDetailsModal";
import StaffPickupRequestDetailsModal from "@/components/staff/pickup-requests/StaffPickupRequestDetailsModal";
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
  const [pickupRecords, setPickupRecords] = useState<Request[]>(pickupRequests);
  const [deliveryRecords, setDeliveryRecords] =
    useState<Request[]>(deliveryRequests);
  const [selectedPickupRequest, setSelectedPickupRequest] =
    useState<Request | null>(null);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [selectedDeliveryRequest, setSelectedDeliveryRequest] =
    useState<Request | null>(null);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const records = delivery ? deliveryRecords : pickupRecords;

  const handleViewPickup = useCallback((pickupRequest: Request) => {
    setSelectedPickupRequest(pickupRequest);
    setIsPickupModalOpen(true);
  }, []);

  const handleClosePickup = useCallback(() => {
    setIsPickupModalOpen(false);
    setSelectedPickupRequest(null);
  }, []);

  const handleViewDelivery = useCallback((deliveryRequest: Request) => {
    setSelectedDeliveryRequest(deliveryRequest);
    setIsDeliveryModalOpen(true);
  }, []);

  const handleCloseDelivery = useCallback(() => {
    setIsDeliveryModalOpen(false);
    setSelectedDeliveryRequest(null);
  }, []);

  const handlePickupStatusChange = useCallback(
    (orderReference: string, nextStatus: "Ready for Pickup" | "Completed") => {
      setPickupRecords((currentRecords) =>
        currentRecords.map((record) =>
          record.orderReference === orderReference
            ? {
                ...record,
                status: nextStatus,
              }
            : record,
        ),
      );
      handleClosePickup();
    },
    [handleClosePickup],
  );

  const handleDeliveryStatusChange = useCallback(
    (orderReference: string, nextStatus: "Booked" | "Delivered") => {
      setDeliveryRecords((currentRecords) =>
        currentRecords.map((record) =>
          record.orderReference === orderReference
            ? {
                ...record,
                status: nextStatus,
              }
            : record,
        ),
      );
      handleCloseDelivery();
    },
    [handleCloseDelivery],
  );

  const columns: Column<Request>[] = useMemo(
    () => [
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
      {
        label: "Action",
        render: (row) => (
          <ActionButton
            label={row.action}
            onClick={
              delivery
                ? () => handleViewDelivery(row)
                : () => handleViewPickup(row)
            }
          />
        ),
      },
    ],
    [delivery, handleViewDelivery, handleViewPickup],
  );
  const title = delivery ? "Delivery Requests" : "Pickup Requests";
  const summary: SummaryItem[] = delivery
    ? [
        [String(records.length), "Delivery Requests", "All delivery requests"],
        [
          String(
            records.filter(
              (record) =>
                record.status === "Waiting for Booking" ||
                record.status === "Booked" ||
                record.status === "In Transit",
            ).length,
          ),
          "Active Deliveries",
          "Booking or transit",
        ],
        [
          String(
            records.filter((record) => record.status === "Delivered").length,
          ),
          "Delivered",
          "Successfully delivered",
        ],
        [
          String(
            records.filter(
              (record) => record.status === "Waiting for Booking",
            ).length,
          ),
          "Waiting for Booking",
          "Needs staff action",
        ],
      ]
    : [
        [String(records.length), "Pickup Requests", "All pickup orders"],
        [
          String(
            records.filter(
              (record) =>
                record.status === "Preparing" ||
                record.status === "Ready for Pickup",
            ).length,
          ),
          "Active Pickups",
          "Preparing or ready",
        ],
        [
          String(
            records.filter((record) => record.status === "Preparing").length,
          ),
          "Preparing",
          "Currently being prepared",
        ],
        [
          String(
            records.filter((record) => record.status === "Completed").length,
          ),
          "Completed",
          "Picked up successfully",
        ],
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
      {!delivery ? (
        <StaffPickupRequestDetailsModal
          pickupRequest={selectedPickupRequest}
          isOpen={isPickupModalOpen}
          onClose={handleClosePickup}
          onStatusChange={handlePickupStatusChange}
        />
      ) : null}
      {delivery ? (
        <StaffDeliveryRequestDetailsModal
          deliveryRequest={selectedDeliveryRequest}
          isOpen={isDeliveryModalOpen}
          onClose={handleCloseDelivery}
          onStatusChange={handleDeliveryStatusChange}
        />
      ) : null}
    </div>
  );
}
