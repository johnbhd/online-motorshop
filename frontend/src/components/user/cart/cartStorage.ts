import type { ProductDisplayItem } from "../products/productsData";
import type { CartItemData, CartProduct } from "./cartTypes";

export const CART_STORAGE_KEY = "ald_cart";
export const CART_UPDATED_EVENT = "ald-cart-updated";

export function readStoredCartItems(): CartItemData[] | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(CART_STORAGE_KEY);

    if (storedValue === null) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return null;
    }

    return parsedValue.filter(isCartItemData);
  } catch {
    return null;
  }
}

export function getCurrentCartItems(): CartItemData[] {
  return readStoredCartItems() ?? [];
}

export function getStoredCartQuantity(): number {
  return (readStoredCartItems() ?? []).reduce((total, item) => {
    return total + item.quantity;
  }, 0);
}

export function writeCartItems(items: CartItemData[]): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function clearStoredCart(): boolean {
  return writeCartItems([]);
}

export function addProductToCart(
  product: ProductDisplayItem,
  quantity: number,
): boolean {
  const currentItems = getCurrentCartItems();
  const safeQuantity = Number.isFinite(quantity)
    ? Math.max(1, Math.floor(quantity))
    : 1;
  const productForCart: CartProduct = {
    id: product.id,
    partNumber: product.partNumber,
    name: product.name,
    brand: product.brand,
    image: product.image,
    alt: product.alt,
  };
  const existingItem = currentItems.find(
    (item) => item.product.id === product.id,
  );

  if (existingItem) {
    return writeCartItems(
      currentItems.map((item) => {
        if (item.product.id !== product.id) {
          return item;
        }

        return {
          ...item,
          quantity: item.quantity + safeQuantity,
        };
      }),
    );
  }

  return writeCartItems([
    ...currentItems,
    {
      product: productForCart,
      compatibility: "Compatibility to be confirmed by ALD staff",
      price: product.price,
      quantity: safeQuantity,
    },
  ]);
}

function isCartItemData(value: unknown): value is CartItemData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<CartItemData>;
  const product = candidate.product as Partial<CartProduct> | undefined;

  return Boolean(
    product &&
      typeof product.id === "string" &&
      typeof product.partNumber === "string" &&
      typeof product.name === "string" &&
      typeof product.brand === "string" &&
      typeof product.image === "string" &&
      typeof product.alt === "string" &&
      typeof candidate.compatibility === "string" &&
      typeof candidate.price === "number" &&
      Number.isFinite(candidate.price) &&
      typeof candidate.quantity === "number" &&
      Number.isFinite(candidate.quantity) &&
      candidate.quantity >= 1,
  );
}
