import {
  adminCustomers,
  adminDeliveries,
  adminOrders,
  adminPickups,
} from "@/lib/mock/admin";
import {
  customers as staffCustomers,
  deliveryRequests,
  pickupRequests,
  type Order,
} from "@/lib/mock/staff";
import {
  getAdminOrderDetails,
  type AdminOrderItem,
} from "@/components/admin/orders/orderDetails";

export type StaffOrderDetails = {
  customerPhone?: string;
  customerEmail?: string;
  customerType?: string;
  branch?: string;
  pickupSchedule?: string;
  deliveryAddress?: string;
  deliveryFee?: string;
  items: AdminOrderItem[];
};

export function getStaffOrderDetails(order: Order): StaffOrderDetails {
  const adminOrder = adminOrders.find(
    (item) => item.reference === order.reference,
  );
  const adminCustomer = adminCustomers.find(
    (item) => item.name === order.customer,
  );
  const staffCustomer = staffCustomers.find(
    (item) => item.name === order.customer,
  );
  const pickupRequest = pickupRequests.find(
    (item) => item.orderReference === order.reference,
  );
  const deliveryRequest = deliveryRequests.find(
    (item) => item.orderReference === order.reference,
  );
  const pickupRecord = adminPickups.find(
    (item) => item.order === order.reference,
  );
  const deliveryRecord = adminDeliveries.find(
    (item) => item.order === order.reference,
  );

  const adminDetails = adminOrder
    ? getAdminOrderDetails(adminOrder)
    : undefined;

  return {
    customerPhone: adminCustomer?.contact ?? staffCustomer?.contact,
    customerEmail: adminCustomer?.email ?? staffCustomer?.email,
    customerType: adminCustomer?.type ?? staffCustomer?.type,
    branch: adminOrder?.branch ?? pickupRequest?.branch ?? deliveryRequest?.branch,
    pickupSchedule: pickupRecord?.schedule,
    deliveryAddress: deliveryRequest?.destination ?? deliveryRecord?.destination,
    deliveryFee: deliveryRecord?.fee,
    items: adminDetails?.items ?? [],
  };
}
