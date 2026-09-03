"use client";

import Image from "next/image";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faMinus,
  faPlus,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import type { ProductDisplayItem } from "./productsData";
import type { ProductViewMode } from "./ProductsToolbar";

type ProductCardProps = {
  product: ProductDisplayItem;
  viewMode: ProductViewMode;
};

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export default function ProductCard({ product, viewMode }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const priceLabel = product.price
    ? currencyFormatter.format(product.price)
    : "Contact for price";
  const statusLabel = product.status === "active" ? "Listed" : "Unavailable";

  return (
    <article className={`products-card products-card--${viewMode}`}>
      <div className="products-card-image">
        <Image
          src={product.image}
          alt={product.alt}
          fill
          sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw"
        />
      </div>

      <div className="products-card-content">
        <p className={`products-card-brand products-card-brand--${product.brand.toLowerCase()}`}>
          {product.brand}
        </p>
        <h3>{product.name}</h3>
        <p className="products-card-part-number">
          Part No: {product.partNumber}
        </p>
        <p className="products-card-description">{product.description}</p>

        <div className="products-card-price-row">
          <span className="products-card-price">{priceLabel}</span>
          <span
            className={`products-card-status products-card-status--${
              product.status === "active" ? "listed" : "unavailable"
            }`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="products-card-actions">
          <div className="products-quantity-stepper" aria-label="Quantity">
            <button
              type="button"
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              aria-label={`Decrease quantity for ${product.name}`}
            >
              <FontAwesomeIcon icon={faMinus} aria-hidden="true" />
            </button>
            <span aria-live="polite">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((current) => current + 1)}
              aria-label={`Increase quantity for ${product.name}`}
            >
              <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
            </button>
          </div>
          <button className="products-add-cart-button" type="button">
            <FontAwesomeIcon icon={faCartShopping} aria-hidden="true" />
            <span>Add to Cart</span>
          </button>
        </div>

        <span className="products-card-details">
          <span>View Details</span>
          <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}
