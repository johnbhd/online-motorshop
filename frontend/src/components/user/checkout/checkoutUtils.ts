import { aboutBranches } from "../about/aboutData";
import { readStoredCartItems } from "../cart/cartStorage";
import { formatCartCurrency, getCartSubtotal, isUsablePrice } from "../cart/cartData";
import {
  getBranchId,
  SELECTED_BRANCH_STORAGE_KEY,
} from "@/lib/branches/branchStorage";
import {
  createOrderReference,
  getDemoOrderByReference,
  getDemoOrderByReferenceAndContact,
  normalizeContactNumber,
  normalizeOrderReference,
  ORDERS_STORAGE_KEY,
  readDemoOrders,
  saveDemoOrder,
  updateDemoOrderStatus,
} from "@/lib/orders/orderStorage";
import type { CartItemData } from "../cart/cartTypes";
import type {
  CheckoutFieldErrors,
  CheckoutFormData,
  DemoOrder,
} from "./checkoutTypes";
export const CUSTOMER_STORAGE_KEY = "ald_customer";


export { getBranchId, SELECTED_BRANCH_STORAGE_KEY };
export {
  createOrderReference,
  getDemoOrderByReference,
  getDemoOrderByReferenceAndContact,
  normalizeContactNumber,
  normalizeOrderReference,
  ORDERS_STORAGE_KEY,
  readDemoOrders,
  saveDemoOrder,
  updateDemoOrderStatus,
};

export function getCheckoutCartItems(): CartItemData[] {
  return readStoredCartItems() ?? [];
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

export function readDemoCustomer(): DemoOrder["customer"] | null {
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

export function formatOrderTimestamp(timestamp: string): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function hasDisplayablePrices(items: CartItemData[]): boolean {
  return items.length > 0 && items.every((item) => isUsablePrice(item.price));
}

export { getCartSubtotal };

export function formatCheckoutPrice(amount: number): string {
  return formatCartCurrency(amount);
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
