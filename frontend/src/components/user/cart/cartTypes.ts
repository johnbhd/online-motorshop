import type { ProductDisplayItem } from "../products/productsData";

export type CartProduct = Pick<
  ProductDisplayItem,
  "id" | "partNumber" | "name" | "brand" | "image" | "alt"
>;

export type CartItemData = {
  product: CartProduct;
  compatibility: string;
  price: number;
  quantity: number;
};

export type FulfillmentMethod = "pickup" | "delivery";
