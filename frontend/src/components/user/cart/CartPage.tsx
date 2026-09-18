"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowsRotate,
  faCircleInfo,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import CartItems from "./CartItems";
import CartOrderRequestNotice from "./CartOrderRequestNotice";
import CartSummary from "./CartSummary";
import { initialCartItems } from "./cartData";
import {
  readStoredCartItems,
  writeCartItems,
} from "./cartStorage";
import type { FulfillmentMethod } from "./cartTypes";
import { hasDisplayablePrices } from "../checkout/checkoutUtils";

export default function CartPage() {
  const [cartItems, setCartItems] = useState(initialCartItems);
  const [fulfillmentMethod, setFulfillmentMethod] =
    useState<FulfillmentMethod>("pickup");
  const [cartStatus, setCartStatus] = useState("");
  const [isCartReady, setIsCartReady] = useState(false);

  useEffect(() => {
    const storedCartItems = readStoredCartItems();

    if (storedCartItems) {
      // Browser storage is read after hydration to avoid server/client markup drift.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate shared cart storage after the client mounts
      setCartItems(storedCartItems);
    } else {
      writeCartItems(initialCartItems);
    }

    setIsCartReady(true);
  }, []);

  useEffect(() => {
    if (isCartReady) {
      writeCartItems(cartItems);
    }
  }, [cartItems, isCartReady]);

  const totalQuantity = cartItems.reduce((total, item) => {
    return total + item.quantity;
  }, 0);

  const subtotal = cartItems.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  const handleIncrement = (itemId: string) => {
    setCartStatus("");
    setCartItems((currentItems) => {
      return currentItems.map((item) => {
        if (item.product.id !== itemId) {
          return item;
        }

        return {
          ...item,
          quantity: item.quantity + 1,
        };
      });
    });
  };

  const handleDecrement = (itemId: string) => {
    setCartStatus("");
    setCartItems((currentItems) => {
      return currentItems.map((item) => {
        if (item.product.id !== itemId) {
          return item;
        }

        return {
          ...item,
          quantity: Math.max(1, item.quantity - 1),
        };
      });
    });
  };

  const handleRemove = (itemId: string) => {
    const removedItem = cartItems.find(
      (item) => item.product.id === itemId,
    );

    setCartItems((currentItems) => {
      return currentItems.filter((item) => item.product.id !== itemId);
    });

    if (removedItem) {
      setCartStatus(`${removedItem.product.name} was removed from your cart.`);
    }
  };

  const handleClearCart = () => {
    setCartItems([]);
    setCartStatus("Your cart was cleared.");
  };

  const handleUpdateCart = () => {
    setCartItems((currentItems) => {
      return currentItems.map((item) => {
        return {
          ...item,
          quantity: Number.isFinite(item.quantity)
            ? Math.max(1, Math.floor(item.quantity))
            : 1,
        };
      });
    });
    setCartStatus("Cart totals updated.");
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

              <div className="cart-actions-row">
                <Link
                  className="cart-button cart-button--secondary"
                  href="/products"
                >
                  <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
                  Continue Shopping
                </Link>
                <button
                  className="cart-button cart-button--dark"
                  type="button"
                  onClick={handleUpdateCart}
                >
                  <FontAwesomeIcon icon={faArrowsRotate} aria-hidden="true" />
                  Update Cart
                </button>
              </div>

              <CartOrderRequestNotice />
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
