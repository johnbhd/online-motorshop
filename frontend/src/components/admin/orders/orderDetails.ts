import {
  adminCustomers,
  adminDeliveries,
  type AdminOrder,
} from "@/lib/mock/admin";

export type AdminOrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
};

export type OrderUpdateDraft = {
  status: string;
  staff: string;
  fulfillment: string;
  pickupBranch: string;
  pickupStatus: string;
  pickupNotes: string;
  deliveryAddress: string;
  bookingStatus: string;
  riderStatus: string;
  deliveryNotes: string;
};

export type AdminOrderDetails = {
  customerPhone?: string;
  customerEmail?: string;
  items: AdminOrderItem[];
  deliveryAddress?: string;
  deliveryFee?: string;
};

export const adminOrderStatuses = [
  "Pending",
  "Under Review",
  "Preparing",
  "Ready for Pickup",
  "Waiting for Booking",
  "In Transit",
  "Completed",
  "Cancelled",
] as const;

const orderItemsByReference: Record<string, AdminOrderItem[]> = {
  "ALD-2026-000128": [
    {
      id: "128-brake-pad",
      name: "Genuine Honda Brake Pad Set",
      quantity: 1,
      price: 850,
      subtotal: 850,
    },
    {
      id: "128-engine-oil",
      name: "Premium 4T Motorcycle Engine Oil",
      quantity: 2,
      price: 500,
      subtotal: 1000,
    },
  ],
  "ALD-2026-000127": [
    {
      id: "127-battery",
      name: "Yamaha Motorcycle Battery",
      quantity: 1,
      price: 1650,
      subtotal: 1650,
    },
    {
      id: "127-tire",
      name: "Motorcycle Tire 70/90-17",
      quantity: 1,
      price: 1450,
      subtotal: 1450,
    },
    {
      id: "127-spark-plug",
      name: "Motorcycle Spark Plug",
      quantity: 1,
      price: 300,
      subtotal: 300,
    },
  ],
  "ALD-2026-000126": [
    {
      id: "126-disc-rotor",
      name: "Front Brake Disc Rotor",
      quantity: 1,
      price: 1200,
      subtotal: 1200,
    },
    {
      id: "126-tire",
      name: "Motorcycle Tire 70/90-17",
      quantity: 1,
      price: 1450,
      subtotal: 1450,
    },
    {
      id: "126-oil",
      name: "Premium 4T Motorcycle Engine Oil",
      quantity: 1,
      price: 380,
      subtotal: 380,
    },
    {
      id: "126-spark-plug",
      name: "Motorcycle Spark Plug",
      quantity: 1,
      price: 230,
      subtotal: 230,
    },
  ],
  "ALD-2026-000125": [
    {
      id: "125-drive-belt",
      name: "Honda Drive Belt",
      quantity: 1,
      price: 780,
      subtotal: 780,
    },
    {
      id: "125-spark-plug",
      name: "Motorcycle Spark Plug",
      quantity: 1,
      price: 140,
      subtotal: 140,
    },
  ],
  "ALD-2026-000124": [
    {
      id: "124-tire",
      name: "Motorcycle Tire 70/90-17",
      quantity: 1,
      price: 1450,
      subtotal: 1450,
    },
    {
      id: "124-oil",
      name: "Premium 4T Motorcycle Engine Oil",
      quantity: 1,
      price: 380,
      subtotal: 380,
    },
    {
      id: "124-disc-rotor",
      name: "Front Brake Disc Rotor",
      quantity: 1,
      price: 640,
      subtotal: 640,
    },
  ],
  "ALD-2026-000123": [
    {
      id: "123-brake-pad",
      name: "Genuine Honda Brake Pad Set",
      quantity: 1,
      price: 850,
      subtotal: 850,
    },
    {
      id: "123-battery",
      name: "Yamaha Motorcycle Battery",
      quantity: 1,
      price: 1650,
      subtotal: 1650,
    },
    {
      id: "123-tire",
      name: "Motorcycle Tire 70/90-17",
      quantity: 1,
      price: 940,
      subtotal: 940,
    },
  ],
  "ALD-2026-000122": [
    {
      id: "122-disc-rotor",
      name: "Front Brake Disc Rotor",
      quantity: 1,
      price: 1200,
      subtotal: 1200,
    },
    {
      id: "122-drive-belt",
      name: "Honda Drive Belt",
      quantity: 1,
      price: 780,
      subtotal: 780,
    },
    {
      id: "122-spark-plug",
      name: "Motorcycle Spark Plug",
      quantity: 1,
      price: 170,
      subtotal: 170,
    },
  ],
  "ALD-2026-000121": [
    {
      id: "121-drive-belt",
      name: "Honda Drive Belt",
      quantity: 1,
      price: 780,
      subtotal: 780,
    },
  ],
};

function parseOrderAmount(amount: string) {
  const parsedAmount = Number(amount.replace(/[^0-9.]/g, ""));

  return Number.isFinite(parsedAmount) ? parsedAmount : 0;
}

export function getAdminOrderDetails(order: AdminOrder): AdminOrderDetails {
  const customer = adminCustomers.find((item) => item.name === order.customer);
  const delivery = adminDeliveries.find(
    (item) => item.order === order.reference,
  );
  const fallbackAmount = parseOrderAmount(order.amount);

  return {
    customerPhone: customer?.contact,
    customerEmail: customer?.email,
    items: orderItemsByReference[order.reference] ?? [
      {
        id: `${order.reference}-summary`,
        name: "Order item details unavailable",
        quantity: 1,
        price: fallbackAmount,
        subtotal: fallbackAmount,
      },
    ],
    deliveryAddress: delivery?.destination,
    deliveryFee: delivery?.fee,
  };
}
