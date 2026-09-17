import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faCircleInfo,
  faFileLines,
  faIdCard,
  faLock,
  faStore,
  faTruck,
  faUserCheck,
} from "@fortawesome/free-solid-svg-icons";
import { formatCartCurrency } from "./cartData";
import type { FulfillmentMethod } from "./cartTypes";

type CartSummaryProps = {
  subtotal: number;
  totalQuantity: number;
  fulfillmentMethod: FulfillmentMethod;
  onFulfillmentChange: (method: FulfillmentMethod) => void;
};

export default function CartSummary({
  subtotal,
  totalQuantity,
  fulfillmentMethod,
  onFulfillmentChange,
}: CartSummaryProps) {
  const itemLabel = totalQuantity === 1 ? "item" : "items";

  return (
    <aside className="cart-sidebar" aria-labelledby="cart-summary-title">
      <p className="cart-items-count">
        {totalQuantity} {itemLabel} in your cart
      </p>

      <div className="cart-mini-info" role="note">
        <FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" />
        <p>
          Adding products to your cart does not confirm availability or
          complete the order. ALD staff will review your request after
          checkout.
        </p>
      </div>

      <div className="cart-summary-card">
        <h2 id="cart-summary-title">Order Summary</h2>

        <div className="cart-summary-row">
          <span>Products subtotal</span>
          <strong>{formatCartCurrency(subtotal)}</strong>
        </div>

        <div className="cart-summary-row">
          <span>Delivery fee</span>
          <span className="cart-muted">Calculated after confirmation</span>
        </div>

        <div className="cart-summary-row">
          <span>Discount</span>
          <span>{formatCartCurrency(0)}</span>
        </div>

        <div className="cart-summary-row cart-summary-total">
          <span>Estimated total</span>
          <strong>{formatCartCurrency(subtotal)}</strong>
        </div>

        <p className="cart-summary-disclaimer">
          The final amount may change after ALD staff confirms product
          availability, compatibility, delivery fee, and order details.
        </p>

        <fieldset className="cart-fulfillment">
          <legend>Fulfillment Method</legend>

          <label
            className={`cart-fulfillment-option${
              fulfillmentMethod === "pickup" ? " is-selected" : ""
            }`}
          >
            <input
              type="radio"
              name="fulfillment-method"
              value="pickup"
              checked={fulfillmentMethod === "pickup"}
              onChange={() => onFulfillmentChange("pickup")}
            />
            <span className="cart-fulfillment-icon" aria-hidden="true">
              <FontAwesomeIcon icon={faStore} />
            </span>
            <span className="cart-fulfillment-copy">
              <strong>Store Pickup</strong>
              <span>Select a branch during checkout</span>
            </span>
          </label>

          <label
            className={`cart-fulfillment-option${
              fulfillmentMethod === "delivery" ? " is-selected" : ""
            }`}
          >
            <input
              type="radio"
              name="fulfillment-method"
              value="delivery"
              checked={fulfillmentMethod === "delivery"}
              onChange={() => onFulfillmentChange("delivery")}
            />
            <span className="cart-fulfillment-icon" aria-hidden="true">
              <FontAwesomeIcon icon={faTruck} />
            </span>
            <span className="cart-fulfillment-copy">
              <strong>Lalamove Delivery</strong>
              <span>Fee confirmed by ALD staff</span>
            </span>
          </label>
        </fieldset>

        <section
          className="cart-customer-block"
          aria-labelledby="cart-customer-title"
        >
          <FontAwesomeIcon
            className="cart-customer-icon"
            icon={faIdCard}
            aria-hidden="true"
          />
          <div>
            <h3 id="cart-customer-title">Customer details</h3>
            <p>
              <strong>Customer:</strong> Guest checkout
            </p>
            <p>
              <strong>Status:</strong> Details collected during checkout
            </p>
            <p className="cart-customer-note">
              You can review or update your contact and fulfillment details
              during checkout.
            </p>
          </div>
        </section>

        <button
          className="cart-checkout-button"
          type="button"
          disabled
          aria-describedby="cart-checkout-note"
        >
          <FontAwesomeIcon icon={faCartShopping} aria-hidden="true" />
          Proceed to Checkout
        </button>

        <p className="cart-checkout-note" id="cart-checkout-note">
          Checkout details are not available in this migration yet. The future
          flow will submit an order request for staff confirmation; it will not
          finalize a sale automatically.
        </p>

        <ul className="cart-assurance-list">
          <li>
            <FontAwesomeIcon icon={faLock} aria-hidden="true" />
            Secure customer information
          </li>
          <li>
            <FontAwesomeIcon icon={faUserCheck} aria-hidden="true" />
            Guest ordering supported
          </li>
          <li>
            <FontAwesomeIcon icon={faFileLines} aria-hidden="true" />
            Order reference provided after submission
          </li>
        </ul>
      </div>
    </aside>
  );
}
