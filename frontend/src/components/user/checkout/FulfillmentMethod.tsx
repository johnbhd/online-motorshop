import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStore, faTruck } from "@fortawesome/free-solid-svg-icons";
import type { FulfillmentMethod } from "../cart/cartTypes";

type FulfillmentMethodProps = {
  value: FulfillmentMethod;
  onChange: (method: FulfillmentMethod) => void;
};

export default function FulfillmentMethod({
  value,
  onChange,
}: FulfillmentMethodProps) {
  return (
    <fieldset
      className="checkout-section checkout-section--fulfillment"
      aria-labelledby="checkout-fulfillment-title"
    >
      <legend
        className="checkout-section-heading checkout-section-heading--legend"
        id="checkout-fulfillment-title"
      >
        <span className="checkout-section-icon" aria-hidden="true">
          <FontAwesomeIcon icon={faTruck} />
        </span>
        <span className="checkout-section-heading-copy">
          <span className="checkout-section-title">
            How would you like to receive your order?
          </span>
          <span className="checkout-section-description">
            Choose how ALD staff should prepare your confirmed request.
          </span>
        </span>
      </legend>

      <div className="checkout-option-grid">
        <label
          className={`checkout-option-card${value === "pickup" ? " checkout-option-card--active" : ""}`}
        >
          <input
            type="radio"
            name="checkout-fulfillment"
            value="pickup"
            checked={value === "pickup"}
            onChange={() => {
              onChange("pickup");
            }}
          />
          <span className="checkout-option-icon" aria-hidden="true">
            <FontAwesomeIcon icon={faStore} />
          </span>
          <span className="checkout-option-copy">
            <strong>Store Pickup</strong>
            <span>Pick up your confirmed request from an ALD branch.</span>
          </span>
        </label>

        <label
          className={`checkout-option-card${value === "delivery" ? " checkout-option-card--active" : ""}`}
        >
          <input
            type="radio"
            name="checkout-fulfillment"
            value="delivery"
            checked={value === "delivery"}
            onChange={() => {
              onChange("delivery");
            }}
          />
          <span className="checkout-option-icon" aria-hidden="true">
            <FontAwesomeIcon icon={faTruck} />
          </span>
          <span className="checkout-option-copy">
            <strong>Lalamove Delivery</strong>
            <span>ALD staff will arrange delivery after confirmation.</span>
          </span>
        </label>
      </div>
    </fieldset>
  );
}
