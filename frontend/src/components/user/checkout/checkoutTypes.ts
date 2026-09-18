import type { CartItemData, FulfillmentMethod } from "../cart/cartTypes";

export type CheckoutCustomerData = {
  fullName: string;
  email: string;
  contactNumber: string;
};

export type CheckoutDeliveryData = {
  address: string;
  barangay: string;
  city: string;
  contactPerson: string;
  notes: string;
};

export type CheckoutFormData = CheckoutCustomerData & {
  fulfillmentMethod: FulfillmentMethod;
  branchId: string;
  delivery: CheckoutDeliveryData;
  orderNotes: string;
  confirmDetails: boolean;
};

export type CheckoutTextField =
  | "fullName"
  | "email"
  | "contactNumber"
  | "branchId"
  | "orderNotes";

export type CheckoutDeliveryField = keyof CheckoutDeliveryData;

export type CheckoutFieldErrorKey =
  | "fullName"
  | "email"
  | "contactNumber"
  | "branchId"
  | "deliveryAddress"
  | "barangay"
  | "city"
  | "contactPerson"
  | "confirmDetails";

export type CheckoutFieldErrors = Partial<
  Record<CheckoutFieldErrorKey, string>
>;

export type DemoOrderFulfillment =
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
      delivery: CheckoutDeliveryData;
    };

export type DemoOrder = {
  reference: string;
  customer: CheckoutCustomerData;
  items: CartItemData[];
  fulfillment: DemoOrderFulfillment;
  orderNotes: string;
  estimatedSubtotal: number | null;
  totalQuantity: number;
  status: "Pending";
  paymentStatus: "Unpaid";
  createdAt: string;
};
