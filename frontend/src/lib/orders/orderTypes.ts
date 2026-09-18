export type OrderStatus =
  | "Pending"
  | "Under Review"
  | "Confirmed"
  | "Waiting for Payment"
  | "Payment Verification"
  | "Preparing Order"
  | "Ready for Pickup"
  | "Booked for Delivery"
  | "Picked Up by Rider"
  | "Completed"
  | "Rejected"
  | "Cancelled";

export type PaymentStatus =
  | "Unpaid"
  | "Waiting for Payment"
  | "Payment Verification"
  | "Paid";

export type OrderCustomerSnapshot = {
  fullName: string;
  email: string;
  contactNumber: string;
};

export type OrderProductSnapshot = {
  id: string;
  partNumber: string;
  name: string;
  brand: string;
  image: string;
  alt: string;
};

export type OrderItemSnapshot = {
  product: OrderProductSnapshot;
  compatibility: string;
  price: number;
  quantity: number;
};

export type OrderDeliverySnapshot = {
  address: string;
  barangay: string;
  city: string;
  contactPerson: string;
  notes: string;
};

export type OrderFulfillment =
  | {
      method: "pickup";
      branch: {
        id: string;
        name: string;
        address: string;
      };
    }
  | {
      method: "delivery";
      delivery: OrderDeliverySnapshot;
    };

export type OrderActivity = {
  id: string;
  status: OrderStatus;
  title: string;
  message: string;
  createdAt: string;
};

export type DemoOrder = {
  reference: string;
  customerAccountId: string | null;
  customer: OrderCustomerSnapshot;
  items: OrderItemSnapshot[];
  fulfillment: OrderFulfillment;
  orderNotes: string;
  estimatedSubtotal: number | null;
  finalAmount?: number | null;
  totalQuantity: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  activities: OrderActivity[];
};
