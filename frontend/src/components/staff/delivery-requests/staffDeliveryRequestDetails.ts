import {
  adminCustomers,
  adminDeliveries,
  type AdminOrder,
} from "@/lib/mock/admin";
import {
  customers as staffCustomers,
  type Request,
} from "@/lib/mock/staff";
import {
  getAdminOrderDetails,
  type AdminOrderItem,
} from "@/components/admin/orders/orderDetails";

export type StaffDeliveryRequestDetails = {
  customerPhone?: string;
  customerEmail?: string;
  customerType?: string;
  deliveryFee?: string;
  items: AdminOrderItem[];
};

function createRelatedOrder(request: Request): AdminOrder {
  return {
    reference: request.orderReference,
    customer: request.customer,
    branch: request.branch.replace(/ Branch$/, ""),
    amount: request.amount,
    fulfillment: "Lalamove Delivery",
    staff: "Not available",
    status: request.status,
    updated: request.updated,
    action: "View Delivery",
  };
}

export function getStaffDeliveryRequestDetails(
  request: Request,
): StaffDeliveryRequestDetails {
  const relatedOrder = createRelatedOrder(request);
  const orderDetails = getAdminOrderDetails(relatedOrder);
  const adminCustomer = adminCustomers.find(
    (customer) => customer.name === request.customer,
  );
  const staffCustomer = staffCustomers.find(
    (customer) => customer.name === request.customer,
  );
  const deliveryRecord = adminDeliveries.find(
    (delivery) => delivery.order === request.orderReference,
  );

  return {
    customerPhone: adminCustomer?.contact ?? staffCustomer?.contact,
    customerEmail: adminCustomer?.email ?? staffCustomer?.email,
    customerType: adminCustomer?.type ?? staffCustomer?.type,
    deliveryFee: deliveryRecord?.fee,
    items: orderDetails.items.filter(
      (item) => item.id !== `${request.orderReference}-summary`,
    ),
  };
}
