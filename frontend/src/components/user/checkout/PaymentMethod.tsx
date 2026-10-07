import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCreditCard,
  faMoneyBillWave,
} from "@fortawesome/free-solid-svg-icons";
import type { FulfillmentMethod } from "../cart/cartTypes";
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethod as PaymentMethodValue,
} from "@/lib/orders/orderRequestTypes";

type PaymentMethodProps = {
  fulfillmentMethod: FulfillmentMethod;
  value: PaymentMethodValue | "";
  error?: string;
  onChange: (value: PaymentMethodValue) => void;
};

const pickupPaymentOptions: Array<{
  value: PaymentMethodValue;
  icon: typeof faCreditCard;
  description: string;
}> = [
  {
    value: "pay_at_pickup",
    icon: faMoneyBillWave,
    description: "Pay at the selected ALD branch when collecting your order.",
  },
  {
    value: "online_payment",
    icon: faCreditCard,
    description:
      "Payment instructions will become available after ALD confirms your order.",
  },
];

const deliveryPaymentOptions = pickupPaymentOptions.filter(
  (option) => option.value === "online_payment",
);

export default function PaymentMethod({
  fulfillmentMethod,
  value,
  error,
  onChange,
}: PaymentMethodProps) {
  const options =
    fulfillmentMethod === "pickup"
      ? pickupPaymentOptions
      : deliveryPaymentOptions;

  return (
    <fieldset
      className="checkout-section checkout-section--payment"
      aria-describedby={`checkout-payment-method-note${
        error ? " checkout-payment-method-error" : ""
      }`}
    >
      <legend className="checkout-section-heading checkout-section-heading--legend">
        <span className="checkout-section-icon" aria-hidden="true">
          <FontAwesomeIcon icon={faCreditCard} />
        </span>
        <span className="checkout-section-heading-copy">
          <span className="checkout-section-title">Payment Method</span>
          <span className="checkout-section-description">
            Choose how you would like to pay after ALD confirms your request.
          </span>
        </span>
      </legend>

      <div className="checkout-option-grid">
        {options.map((option) => (
          <label
            className={`checkout-option-card${
              value === option.value ? " checkout-option-card--active" : ""
            }`}
            key={option.value}
          >
            <input
              type="radio"
              name="checkout-payment-method"
              value={option.value}
              checked={value === option.value}
              aria-describedby={
                error ? "checkout-payment-method-error" : undefined
              }
              onChange={() => {
                onChange(option.value);
              }}
            />
            <span className="checkout-option-icon" aria-hidden="true">
              <FontAwesomeIcon icon={option.icon} />
            </span>
            <span className="checkout-option-copy">
              <strong>{PAYMENT_METHOD_LABELS[option.value]}</strong>
              <span>{option.description}</span>
            </span>
          </label>
        ))}
      </div>

      {error ? (
        <p
          className="checkout-field-error"
          id="checkout-payment-method-error"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <p className="checkout-payment-note" id="checkout-payment-method-note">
        Submitting this request does not charge you yet. ALD will review and
        confirm your order first.
      </p>
    </fieldset>
  );
}
