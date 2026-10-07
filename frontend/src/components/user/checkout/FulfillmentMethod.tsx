import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStore, faTruck } from "@fortawesome/free-solid-svg-icons";
import type { FulfillmentMethod } from "../cart/cartTypes";
import CheckoutOptionCard from "./CheckoutOptionCard";

type FulfillmentMethodProps = {
  value: FulfillmentMethod;
  onChange: (method: FulfillmentMethod) => void;
};

export default function FulfillmentMethod({
  value,
  onChange,
}: FulfillmentMethodProps) {
  return (
    <section
      className="checkout-section checkout-section--fulfillment"
      aria-labelledby="checkout-fulfillment-title"
    >
      <div className="checkout-section-heading">
        <span className="checkout-section-icon" aria-hidden="true">
          <FontAwesomeIcon icon={faTruck} />
        </span>
        <span className="checkout-section-heading-copy">
          <span
            className="checkout-section-title"
            id="checkout-fulfillment-title"
          >
            How would you like to receive your order?
          </span>
          <span className="checkout-section-description">
            Choose how ALD staff should prepare your confirmed request.
          </span>
        </span>
      </div>

      <div
        className="checkout-option-grid"
        role="radiogroup"
        aria-labelledby="checkout-fulfillment-title"
      >
        <CheckoutOptionCard
          name="checkout-fulfillment"
          value="pickup"
          title="Store Pickup"
          description="Pick up your confirmed request from an ALD branch."
          icon={faStore}
          selected={value === "pickup"}
          onSelect={() => {
            onChange("pickup");
          }}
        />

        <CheckoutOptionCard
          name="checkout-fulfillment"
          value="delivery"
          title="Lalamove Delivery"
          description="ALD staff will arrange delivery after confirmation."
          icon={faTruck}
          selected={value === "delivery"}
          onSelect={() => {
            onChange("delivery");
          }}
        />
      </div>
    </section>
  );
}
