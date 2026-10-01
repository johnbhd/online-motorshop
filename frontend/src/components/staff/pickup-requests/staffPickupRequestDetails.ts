import {
  adminBranches,
  adminCustomers,
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

export type StaffPickupRequestDetails = {
  customerPhone?: string;
  customerEmail?: string;
  customerType?: string;
  branchAddress?: string;
  items: AdminOrderItem[];
};

function createRelatedOrder(request: Request): AdminOrder {
  return {
    reference: request.orderReference,
    customer: request.customer,
    branch: request.branch.replace(/ Branch$/, ""),
    amount: request.amount,
    fulfillment: "Store Pickup",
    staff: "Not available",
    status: request.status,
    updated: request.updated,
    action: "View Pickup",
  };
}

export function getStaffPickupRequestDetails(
  request: Request,
): StaffPickupRequestDetails {
  const relatedOrder = createRelatedOrder(request);
  const orderDetails = getAdminOrderDetails(relatedOrder);
  const adminCustomer = adminCustomers.find(
    (customer) => customer.name === request.customer,
  );
  const staffCustomer = staffCustomers.find(
    (customer) => customer.name === request.customer,
  );
  const branch = adminBranches.find(
    (branchRecord) => branchRecord.name === request.branch,
  );

  return {
    customerPhone: adminCustomer?.contact ?? staffCustomer?.contact,
    customerEmail: adminCustomer?.email ?? staffCustomer?.email,
    customerType: adminCustomer?.type ?? staffCustomer?.type,
    branchAddress: branch?.address,
    items: orderDetails.items.filter(
      (item) => item.id !== `${request.orderReference}-summary`,
    ),
  };
}
