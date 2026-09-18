"use client";

import type { ChangeEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faMessage,
  faMinus,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import type { ProductDisplayItem } from "../products/productsData";
import { addProductToCart } from "../cart/cartStorage";

type ProductPurchasePanelProps = {
  product: ProductDisplayItem;
};

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export default function ProductPurchasePanel({
  product,
}: ProductPurchasePanelProps) {
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  const [cartMessage, setCartMessage] = useState("");
  const priceLabel =
    product.price > 0
      ? currencyFormatter.format(product.price)
      : "Price available on request";

  const changeQuantity = (nextQuantity: number) => {
    if (!Number.isFinite(nextQuantity)) {
      return;
    }

    setQuantity(Math.max(1, Math.floor(nextQuantity)));
    setCartMessage("");
  };

  const handleQuantityChange = (event: ChangeEvent<HTMLInputElement>) => {
    changeQuantity(Number(event.target.value));
  };

  const handleAddToCart = () => {
    const didSave = addProductToCart(product, quantity);

    if (didSave) {
      router.push("/cart");
      return;
    }

    setCartMessage(
      "This product could not be added in this browser. Please try again.",
    );
  };

  return (
    <div className="product-details-purchase">
      <div className="product-details-price-row">
        <div>
          <p className="product-details-field-label">Price</p>
          <p className="product-details-price">{priceLabel}</p>
        </div>
        <span className="product-details-price-note">Final price confirmed by staff</span>
      </div>

      <p className="product-details-purchase-note">
        Catalog prices are not yet connected to the live ALD product service.
      </p>

      <div className="product-details-quantity-field">
        <label htmlFor={`product-quantity-${product.id}`}>Quantity</label>
        <div className="product-details-quantity-control">
          <button
            type="button"
            aria-label={`Decrease quantity for ${product.name}`}
            disabled={quantity <= 1}
            onClick={() => {
              changeQuantity(quantity - 1);
            }}
          >
            <FontAwesomeIcon icon={faMinus} aria-hidden="true" />
          </button>
          <input
            id={`product-quantity-${product.id}`}
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={quantity}
            onChange={handleQuantityChange}
            aria-describedby={`product-quantity-note-${product.id}`}
          />
          <button
            type="button"
            aria-label={`Increase quantity for ${product.name}`}
            onClick={() => {
              changeQuantity(quantity + 1);
            }}
          >
            <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
          </button>
        </div>
        <p
          className="product-details-quantity-note"
          id={`product-quantity-note-${product.id}`}
        >
          Minimum quantity is 1. No stock maximum is shown.
        </p>
      </div>

      <div className="product-details-action-stack">
        <button
          className="product-details-primary-button"
          type="button"
          onClick={handleAddToCart}
          aria-describedby="product-details-cart-note"
        >
          <FontAwesomeIcon icon={faCartShopping} aria-hidden="true" />
          Add to Cart
        </button>
        <Link className="product-details-secondary-button" href="/contact">
          <FontAwesomeIcon icon={faMessage} aria-hidden="true" />
          Ask About This Product
        </Link>
      </div>

      <p className="product-details-cart-note" id="product-details-cart-note">
        Your selection is saved in the shared cart for checkout. Price,
        compatibility, and availability are confirmed by ALD staff.
      </p>

      <p className="product-details-cart-message" role="status" aria-live="polite">
        {cartMessage}
      </p>
    </div>
  );
}
