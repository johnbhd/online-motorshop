"use client";

import { formatCartCurrency } from "../cart/cartData";

export type ProductInquiryCardData = {
  name?: string;
  partNumber?: string;
  price?: number | string;
  image?: string | null;
  brand?: string | null;
};

type ProductInquiryCardProps = {
  product: ProductInquiryCardData;
};

export default function ProductInquiryCard({
  product,
}: ProductInquiryCardProps) {
  const price = Number(product.price);
  const priceLabel = Number.isFinite(price) && price > 0
    ? formatCartCurrency(price)
    : "Price unavailable";

  return (
    <div className="ald-chatbot__product-inquiry-card">
      <div className="ald-chatbot__product-inquiry-image-wrap">
        {product.image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            className="ald-chatbot__product-inquiry-image"
            src={product.image}
            alt={
              product.name
                ? `${product.name} product image`
                : "Selected product image"
            }
          />
        ) : (
          <span className="ald-chatbot__product-inquiry-image-fallback">
            Product
          </span>
        )}
      </div>
      <div className="ald-chatbot__product-inquiry-details">
        <p className="ald-chatbot__product-inquiry-name">
          {product.name || "Selected product"}
        </p>
        <p className="ald-chatbot__product-inquiry-meta">
          {product.partNumber || "Product code unavailable"}
          {product.brand ? ` | ${product.brand}` : ""}
        </p>
        <p className="ald-chatbot__product-inquiry-price">{priceLabel}</p>
      </div>
    </div>
  );
}
