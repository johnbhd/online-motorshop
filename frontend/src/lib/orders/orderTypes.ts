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
  unitPrice: number | null;
  lineTotal: number | null;
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
  subtotal: number | null;
  estimatedTotal: number | null;
  finalAmount?: number | null;
  totalQuantity: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  activities: OrderActivity[];
};

export type CustomerOrderBranch = {
  id: number;
  name: string;
  address: string | null;
  contactNumber: string | null;
};

export type CustomerOrderSummary = {
  id: number;
  reference: string;
  status: string;
  orderStatus: string;
  displayStatus: string;
  fulfillmentStatus: string | null;
  paymentStatus: string;
  payment: OrderViewPayment | null;
  fulfillmentMethod: string;
  branch: CustomerOrderBranch | null;
  itemCount: number;
  lineItemCount: number;
  subtotal: number | null;
  deliveryFee: number | null;
  estimatedTotal: number | null;
  totalAmount: number | null;
  createdAt: string;
  updatedAt: string | null;
};

export type OrderViewCustomer = {
  fullName: string;
  contactNumber: string | null;
  email: string | null;
  address: string | null;
};

export type OrderViewItem = {
  product: {
    id: string;
    partNumber: string | null;
    name: string;
    brand: string | null;
    image: string | null;
    alt: string | null;
  };
  unitPrice: number | null;
  lineTotal: number | null;
  quantity: number;
};

export type OrderViewPickup = {
  branchId: number | null;
  status: string;
  pickupDate: string | null;
  pickupTime: string | null;
  remarks: string | null;
  completedAt: string | null;
};

export type OrderViewDelivery = {
  branchId: number | null;
  address: string | null;
  fee: number | null;
  status: string;
  bookingReference: string | null;
  trackingUrl: string | null;
  riderName: string | null;
  riderContact: string | null;
  remarks: string | null;
  deliveredAt: string | null;
};

export type OrderViewFulfillment =
  | {
      method: "pickup";
      branch: CustomerOrderBranch | null;
      pickup: OrderViewPickup | null;
    }
  | {
      method: "delivery";
      branch: CustomerOrderBranch | null;
      delivery: OrderViewDelivery | null;
    };

export type OrderViewPayment = {
  id: number;
  method: string;
  amount: number | null;
  reference: string | null;
  proofImageUrl: string | null;
  status: string;
  verifiedAt: string | null;
};

export type OrderViewModel = {
  id: number;
  reference: string;
  customer: OrderViewCustomer | null;
  items: OrderViewItem[];
  fulfillment: OrderViewFulfillment;
  orderNotes: string | null;
  subtotal: number | null;
  deliveryFee: number | null;
  estimatedTotal: number | null;
  totalAmount: number | null;
  finalAmount: number | null;
  totalQuantity: number;
  status: string;
  orderStatus: string;
  displayStatus: string;
  fulfillmentStatus: string | null;
  paymentStatus: string;
  payment: OrderViewPayment | null;
  createdAt: string;
  updatedAt: string;
  activities: OrderActivity[];
};
