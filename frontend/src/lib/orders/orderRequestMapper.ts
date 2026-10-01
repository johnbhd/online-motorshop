import type { CheckoutBranch } from "../branches/branchApi";
import type { CartItemData } from "@/components/user/cart/cartTypes";
import type { CheckoutFormData } from "@/components/user/checkout/checkoutTypes";
import type { OrderRequestPayload } from "./orderRequestTypes";

export function buildOrderRequestPayload(
  formData: CheckoutFormData,
  cartItems: CartItemData[],
  branches: CheckoutBranch[],
): OrderRequestPayload | null {
  const branch = branches.find(
    (candidate) => String(candidate.id) === formData.branchId,
  );

  if (!branch || cartItems.length === 0) {
    return null;
  }

  const itemPartNumbers = cartItems.map((item) => item.product.partNumber);

  if (
    itemPartNumbers.some((partNumber) => !partNumber.trim()) ||
    new Set(itemPartNumbers).size !== itemPartNumbers.length ||
    cartItems.some(
      (item) =>
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        !Number.isFinite(item.quantity),
    )
  ) {
    return null;
  }

  const basePayload = {
    customer: {
      name: formData.fullName.trim(),
      email: formData.email.trim(),
      contact_number: formData.contactNumber.trim(),
    },
    items: cartItems.map((item) => ({
      part_number: item.product.partNumber,
      quantity: item.quantity,
    })),
    order_notes: formData.orderNotes.trim() || undefined,
  };

  if (formData.fulfillmentMethod === "pickup") {
    return {
      ...basePayload,
      fulfillment: {
        method: "pickup",
        branch_id: branch.id,
      },
    };
  }

  return {
    ...basePayload,
    fulfillment: {
      method: "delivery",
      branch_id: branch.id,
      delivery: {
        address: formData.delivery.address.trim(),
        barangay: formData.delivery.barangay.trim(),
        city: formData.delivery.city.trim(),
        contact_person: formData.delivery.contactPerson.trim(),
        notes: formData.delivery.notes.trim() || undefined,
      },
    },
  };
}
