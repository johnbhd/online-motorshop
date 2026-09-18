import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleInfo,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import {
  calculateLineTotal,
  formatCartCurrency,
  isUsablePrice,
} from "../cart/cartData";
import type { CartItemData } from "../cart/cartTypes";
import {
  getCartSubtotal,
  hasDisplayablePrices,
} from "./checkoutUtils";
import type { CheckoutFieldErrors } from "./checkoutTypes";

type CheckoutOrderSummaryProps = {
  items: CartItemData[];
  confirmDetails: boolean;
  errors: CheckoutFieldErrors;
  isSubmitting: boolean;
  onConfirmChange: (checked: boolean) => void;
};

export default function CheckoutOrderSummary({
  items,
  confirmDetails,
  errors,
  isSubmitting,
  onConfirmChange,
}: CheckoutOrderSummaryProps) {
  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
  const displayablePrices = hasDisplayablePrices(items);
  const subtotal = getCartSubtotal(items);

  return (
    <aside className="checkout-summary" aria-labelledby="checkout-summary-title">
      <div className="checkout-summary-card">
        <div className="checkout-summary-heading">
          <h2 id="checkout-summary-title">Order Summary</h2>
          <p>
            {totalQuantity} {totalQuantity === 1 ? "item" : "items"}
          </p>
        </div>

        <div className="checkout-summary-items">
          {items.map((item) => (
            <div className="checkout-summary-item" key={item.product.id}>
              <div className="checkout-summary-image">
                <Image
                  src={item.product.image}
                  alt={item.product.alt}
                  width={48}
                  height={48}
                  sizes="48px"
                />
              </div>
              <div className="checkout-summary-item-copy">
                <strong>{item.product.name}</strong>
                <span>
                  {item.product.partNumber} · Qty {item.quantity}
                </span>
              </div>
              <div className="checkout-summary-item-pricing">
                <span>
                  Unit price: {isUsablePrice(item.price)
                    ? formatCartCurrency(item.price)
                    : "Price unavailable"} · Qty {item.quantity}
                </span>
                <span className="checkout-summary-item-total-label">
                  Line total
                </span>
                <strong>
                  {isUsablePrice(item.price)
                    ? formatCartCurrency(
                        calculateLineTotal(item.price, item.quantity),
                      )
                    : "Price unavailable"}
                </strong>
              </div>
            </div>
          ))}
        </div>

        <Link className="checkout-edit-cart" href="/cart">
          Edit Cart
        </Link>

        <div className="checkout-summary-totals">
          <div className="checkout-summary-row">
            <span>Products subtotal</span>
            <strong>
              {displayablePrices
                ? formatCartCurrency(subtotal)
                : "To be confirmed"}
            </strong>
          </div>
          <div className="checkout-summary-row">
            <span>Delivery fee</span>
            <span className="checkout-muted">To be confirmed</span>
          </div>
          <div className="checkout-summary-row checkout-summary-row--total">
            <span>Estimated total</span>
            <strong>
              {displayablePrices
                ? formatCartCurrency(subtotal)
                : "Final amount confirmed by staff"}
            </strong>
          </div>
        </div>

        <p className="checkout-summary-disclaimer">
          Final amount may change after ALD staff confirms product availability,
          compatibility, and fulfillment details.
        </p>

        <div className="checkout-order-request-box" role="note">
          <strong>
            <FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" />
            Order Request
          </strong>
          <p>
            Submitting this form saves a request for staff review. It does not
            finalize a guaranteed sale.
          </p>
        </div>

        <label className="checkout-confirmation-check">
          <input
            type="checkbox"
            checked={confirmDetails}
            aria-invalid={Boolean(errors.confirmDetails)}
            aria-describedby={
              errors.confirmDetails ? "checkout-confirmation-error" : undefined
            }
            onChange={(event) => {
              onConfirmChange(event.target.checked);
            }}
          />
          <span>I confirm that my order and contact information are correct.</span>
        </label>
        {errors.confirmDetails ? (
          <p className="checkout-field-error" id="checkout-confirmation-error">
            {errors.confirmDetails}
          </p>
        ) : null}

        <button
          className="checkout-submit-button"
          type="submit"
          disabled={isSubmitting}
        >
          <FontAwesomeIcon icon={faPaperPlane} aria-hidden="true" />
          {isSubmitting ? "Saving Request..." : "Submit Order Request"}
        </button>
        <p className="checkout-submit-note">
          You will receive an ALD order reference after the request is saved.
        </p>
        <Link className="checkout-return-link" href="/cart">
          Return to Cart
        </Link>
      </div>
    </aside>
  );
}
