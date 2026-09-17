import { productCatalog } from "../products/productsData";
import type { CartItemData, CartProduct } from "./cartTypes";

const findProduct = (productId: string): CartProduct => {
  const product = productCatalog.find((candidate) => candidate.id === productId);

  if (!product) {
    throw new Error(`Cart fixture references missing product: ${productId}`);
  }

  return {
    id: product.id,
    partNumber: product.partNumber,
    name: product.name,
    brand: product.brand,
    image: product.image,
    alt: product.alt,
  };
};

/*
 * These temporary local fixtures preserve the migration source's visible
 * quantities and demo amounts. The prices are not authoritative backend data.
 */
export const initialCartItems: CartItemData[] = [
  {
    product: findProduct("HON-003"),
    compatibility: "Honda Click 125i / 150i",
    price: 850,
    quantity: 1,
  },
  {
    product: findProduct("HON-007"),
    compatibility: "Honda commuter motorcycle models",
    price: 1650,
    quantity: 1,
  },
  {
    product: findProduct("YAM-009"),
    compatibility: "Multiple motorcycle models",
    price: 380,
    quantity: 2,
  },
];

export const cartCurrencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 2,
});

export function formatCartCurrency(amount: number): string {
  return cartCurrencyFormatter.format(amount);
}
