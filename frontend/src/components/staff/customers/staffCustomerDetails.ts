import {
  orders,
  type Customer,
  type Order,
} from "@/lib/mock/staff";

const activeOrderStatuses = new Set([
  "Preparing Order",
  "Ready for Pickup",
  "Waiting for Booking",
  "In Transit",
]);

export type StaffCustomerOrderDetails = {
  activeOrders: Order[];
  recentOrders: Order[];
};

export function getStaffCustomerOrderDetails(
  customer: Customer,
): StaffCustomerOrderDetails {
  const linkedOrders = orders
    .filter((order) => order.customer === customer.name)
    .sort((firstOrder, secondOrder) =>
      secondOrder.dateValue.localeCompare(firstOrder.dateValue),
    );

  return {
    activeOrders: linkedOrders.filter((order) =>
      activeOrderStatuses.has(order.status),
    ),
    recentOrders: linkedOrders.slice(0, 5),
  };
}
