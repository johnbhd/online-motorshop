"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCircleInfo,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import CartItems from "./CartItems";
import CartOrderRequestNotice from "./CartOrderRequestNotice";
import CartSummary from "./CartSummary";
import {
  CART_UPDATED_EVENT,
  readStoredCartItems,
  writeCartItems,
} from "./cartStorage";
import type { CartItemData, FulfillmentMethod } from "./cartTypes";
import { hasDisplayablePrices } from "../checkout/checkoutUtils";

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [fulfillmentMethod, setFulfillmentMethod] =
    useState<FulfillmentMethod>("pickup");
  const [cartStatus, setCartStatus] = useState("");

  useEffect(() => {
    const syncCartItems = () => {
      const storedCartItems = readStoredCartItems();

      // Browser storage is read after hydration to avoid server/client markup drift.
      setCartItems(storedCartItems ?? []);
    };

    syncCartItems();
    window.addEventListener(CART_UPDATED_EVENT, syncCartItems);
    window.addEventListener("storage", syncCartItems);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, syncCartItems);
      window.removeEventListener("storage", syncCartItems);
    };
  }, []);

  const totalQuantity = cartItems.reduce((total, item) => {
    return total + item.quantity;
  }, 0);

  const subtotal = cartItems.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  const persistCartItems = (nextItems: CartItemData[]) => {
    if (writeCartItems(nextItems)) {
      setCartItems(nextItems);
      return true;
    }

    setCartStatus("Your cart could not be saved in this browser. Please try again.");
    return false;
  };

  const handleIncrement = (itemId: string) => {
    setCartStatus("");
    persistCartItems(
      cartItems.map((item) => {
        if (item.product.id !== itemId) {
          return item;
        }

        return {
          ...item,
          quantity: item.quantity + 1,
        };
      }),
    );
  };

  const handleDecrement = (itemId: string) => {
    setCartStatus("");
    persistCartItems(
      cartItems.map((item) => {
        if (item.product.id !== itemId) {
          return item;
        }

        return {
          ...item,
          quantity: Math.max(1, item.quantity - 1),
        };
      }),
    );
  };

  const handleRemove = (itemId: string) => {
    const removedItem = cartItems.find(
      (item) => item.product.id === itemId,
    );
    const didSave = persistCartItems(
      cartItems.filter((item) => item.product.id !== itemId),
    );

    if (didSave && removedItem) {
      setCartStatus(`${removedItem.product.name} was removed from your cart.`);
    }
  };

  const handleClearCart = () => {
    if (persistCartItems([])) {
      setCartStatus("Your cart was cleared.");
    }
  };

  const hasItems = cartItems.length > 0;

  return (
    <div className="cart-page">
      <section className="cart-header" aria-labelledby="cart-page-title">
        <div className="cart-container">
          <nav className="cart-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/products">Products</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Shopping Cart</span>
          </nav>

          <p className="cart-eyebrow">Your Selected Products</p>

          <div className="cart-title-row">
            <h1 id="cart-page-title">Shopping Cart</h1>
            {hasItems ? (
              <button
                className="cart-clear-button"
                type="button"
                onClick={handleClearCart}
              >
                <FontAwesomeIcon icon={faTrashCan} aria-hidden="true" />
                Clear Cart
              </button>
            ) : null}
          </div>

          <p className="cart-subtitle">
            Review your selected motorcycle parts, update quantities, and
            continue to checkout when ready.
          </p>
          <p className="cart-visually-hidden" aria-live="polite">
            {cartStatus}
          </p>
        </div>
      </section>

      <section
        className={`cart-layout cart-container${hasItems ? "" : " cart-layout--empty"}`}
        aria-label="Shopping cart contents"
      >
        <div className="cart-main-column">
          <CartItems
            items={cartItems}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onRemove={handleRemove}
          />

          {hasItems ? (
            <>
              <div className="cart-info-banner" role="note">
                <FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" />
                <p>
                  Product availability, compatibility, and final pricing will
                  be confirmed by ALD Motorshop staff <em>after</em> the order
                  request is submitted.
                </p>
              </div>

              <CartOrderRequestNotice />

              <div className="cart-continue-shopping-row">
                <Link
                  className="cart-button cart-button--secondary"
                  href="/products"
                >
                  <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
                  Continue Shopping
                </Link>
              </div>
            </>
          ) : null}
        </div>

        {hasItems ? (
          <CartSummary
            subtotal={subtotal}
            totalQuantity={totalQuantity}
            fulfillmentMethod={fulfillmentMethod}
            onFulfillmentChange={setFulfillmentMethod}
            hasDisplayablePrices={hasDisplayablePrices(cartItems)}
          />
        ) : null}
      </section>
    </div>
  );
}
