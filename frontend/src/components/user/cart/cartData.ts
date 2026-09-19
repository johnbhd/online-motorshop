import type { CartItemData } from "./cartTypes";

export const cartCurrencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPeso(amount: number): string {
  return cartCurrencyFormatter.format(amount);
}

// Backwards-compatible name for existing cart and order UI imports.
export const formatCartCurrency = formatPeso;

export function isUsablePrice(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function calculateLineTotal(
  unitPrice: number,
  quantity: number,
): number {
  if (!isUsablePrice(unitPrice) || !Number.isFinite(quantity) || quantity < 1) {
    return 0;
  }

  return unitPrice * quantity;
}

export function getCartSubtotal(items: CartItemData[]): number {
  return items.reduce((subtotal, item) => {
    return subtotal + calculateLineTotal(item.price, item.quantity);
  }, 0);
}
