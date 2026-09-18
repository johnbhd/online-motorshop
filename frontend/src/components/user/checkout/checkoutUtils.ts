import { aboutBranches } from "../about/aboutData";
import { readStoredCartItems } from "../cart/cartStorage";
import { initialCartItems, formatCartCurrency } from "../cart/cartData";
import type { CartItemData } from "../cart/cartTypes";
import type {
  CheckoutFieldErrors,
  CheckoutFormData,
  DemoOrder,
} from "./checkoutTypes";

export const CUSTOMER_STORAGE_KEY = "ald_customer";
export const ORDERS_STORAGE_KEY = "ald_orders";
export const SELECTED_BRANCH_STORAGE_KEY = "ald_selected_branch";

export function getCheckoutCartItems(): CartItemData[] {
  return readStoredCartItems() ?? initialCartItems;
}

export function getBranchId(branchName: string): string {
  return branchName.toLowerCase().replace(/\s+branch$/, "");
}

export function getBranchById(branchId: string) {
  return aboutBranches.find((branch) => getBranchId(branch.name) === branchId);
}

export function readSelectedBranchId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const storedValue = window.localStorage.getItem(
      SELECTED_BRANCH_STORAGE_KEY,
    );

    if (!storedValue) {
      return "";
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (typeof parsedValue === "string" && getBranchById(parsedValue)) {
      return parsedValue;
    }

    if (parsedValue && typeof parsedValue === "object") {
      const candidate = parsedValue as { id?: unknown; name?: unknown };

      if (typeof candidate.id === "string" && getBranchById(candidate.id)) {
        return candidate.id;
      }

      if (typeof candidate.name === "string") {
        const branchId = getBranchId(candidate.name);

        if (getBranchById(branchId)) {
          return branchId;
        }
      }
    }
  } catch {
    return "";
  }

  return "";
}

export function readDemoCustomer() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(CUSTOMER_STORAGE_KEY);

    if (!storedValue) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (!parsedValue || typeof parsedValue !== "object") {
      return null;
    }

    const candidate = parsedValue as Partial<DemoOrder["customer"]>;

    if (
      typeof candidate.fullName !== "string" ||
      typeof candidate.email !== "string" ||
      typeof candidate.contactNumber !== "string"
    ) {
      return null;
    }

    return {
      fullName: candidate.fullName,
      email: candidate.email,
      contactNumber: candidate.contactNumber,
    };
  } catch {
    return null;
  }
}

export function saveDemoCustomer(customer: DemoOrder["customer"]): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customer));
    return true;
  } catch {
    return false;
  }
}

export function readDemoOrders(): DemoOrder[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(ORDERS_STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(isDemoOrder);
  } catch {
    return [];
  }
}

export function getDemoOrderByReference(reference: string): DemoOrder | null {
  return (
    readDemoOrders().find((order) => order.reference === reference) ?? null
  );
}

export function saveDemoOrder(order: DemoOrder): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const existingOrders = readDemoOrders();
    window.localStorage.setItem(
      ORDERS_STORAGE_KEY,
      JSON.stringify([...existingOrders, order]),
    );
    return true;
  } catch {
    return false;
  }
}

export function createOrderReference(
  existingOrders: DemoOrder[],
  currentDate = new Date(),
): string {
  const year = currentDate.getFullYear();
  const sequence = existingOrders.reduce((highestSequence, order) => {
    const match = order.reference.match(new RegExp(`^ALD-${year}-(\\d+)$`));

    if (!match) {
      return highestSequence;
    }

    return Math.max(highestSequence, Number(match[1]));
  }, 1000);

  return `ALD-${year}-${String(sequence + 1).padStart(6, "0")}`;
}

export function validateCheckoutForm(
  formData: CheckoutFormData,
): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {};

  if (!formData.fullName.trim()) {
    errors.fullName = "Enter your full name.";
  }

  if (!formData.email.trim()) {
    errors.email = "Enter your email address.";
  } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!formData.contactNumber.trim()) {
    errors.contactNumber = "Enter your contact number.";
  }

  if (formData.fulfillmentMethod === "pickup" && !formData.branchId) {
    errors.branchId = "Choose an ALD branch for pickup.";
  }

  if (formData.fulfillmentMethod === "delivery") {
    if (!formData.delivery.address.trim()) {
      errors.deliveryAddress = "Enter the complete delivery address.";
    }

    if (!formData.delivery.barangay.trim()) {
      errors.barangay = "Enter the barangay.";
    }

    if (!formData.delivery.city.trim()) {
      errors.city = "Enter the city or municipality.";
    }

    if (!formData.delivery.contactPerson.trim()) {
      errors.contactPerson = "Enter the delivery contact person.";
    }
  }

  if (!formData.confirmDetails) {
    errors.confirmDetails =
      "Confirm that your order and contact information are correct.";
  }

  return errors;
}

export function hasDisplayablePrices(items: CartItemData[]): boolean {
  return items.length > 0 && items.every((item) => item.price > 0);
}

export function getCartSubtotal(items: CartItemData[]): number {
  return items.reduce((subtotal, item) => {
    return subtotal + item.price * item.quantity;
  }, 0);
}

export function formatCheckoutPrice(amount: number): string {
  return formatCartCurrency(amount);
}

function isDemoOrder(value: unknown): value is DemoOrder {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<DemoOrder>;

  return Boolean(
    typeof candidate.reference === "string" &&
      typeof candidate.status === "string" &&
      typeof candidate.paymentStatus === "string" &&
      typeof candidate.createdAt === "string" &&
      Array.isArray(candidate.items) &&
      candidate.customer &&
      candidate.fulfillment,
  );
}
