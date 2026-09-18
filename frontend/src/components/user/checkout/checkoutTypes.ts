import type { FulfillmentMethod } from "../cart/cartTypes";
import type {
  DemoOrder as StoredDemoOrder,
  OrderCustomerSnapshot,
  OrderDeliverySnapshot,
  OrderFulfillment,
  OrderItemSnapshot,
} from "@/lib/orders/orderTypes";

export type CheckoutCustomerData = OrderCustomerSnapshot;

export type CheckoutDeliveryData = OrderDeliverySnapshot;

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

export type DemoOrderFulfillment = OrderFulfillment;
export type DemoOrderItem = OrderItemSnapshot;
export type DemoOrder = StoredDemoOrder;
