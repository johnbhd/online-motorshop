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
import CheckoutOptionCard from "./CheckoutOptionCard";

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
    <section
      className="checkout-section checkout-section--payment"
      aria-labelledby="checkout-payment-method-title"
      aria-describedby={`checkout-payment-method-note${
        error ? " checkout-payment-method-error" : ""
      }`}
    >
      <div className="checkout-section-heading">
        <span className="checkout-section-icon" aria-hidden="true">
          <FontAwesomeIcon icon={faCreditCard} />
        </span>
        <span className="checkout-section-heading-copy">
          <span
            className="checkout-section-title"
            id="checkout-payment-method-title"
          >
            Payment Method
          </span>
          <span className="checkout-section-description">
            Choose how you would like to pay after ALD confirms your request.
          </span>
        </span>
      </div>

      <div
        className="checkout-option-grid"
        role="radiogroup"
        aria-labelledby="checkout-payment-method-title"
      >
        {options.map((option) => (
          <CheckoutOptionCard
            key={option.value}
            name="checkout-payment-method"
            value={option.value}
            title={PAYMENT_METHOD_LABELS[option.value]}
            description={option.description}
            icon={option.icon}
            selected={value === option.value}
            describedBy={
              error ? "checkout-payment-method-error" : undefined
            }
            onSelect={() => {
              onChange(option.value);
            }}
          />
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
    </section>
  );
}
