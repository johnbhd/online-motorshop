import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faPhone,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import type {
  CheckoutCustomerData,
  CheckoutFieldErrors,
} from "./checkoutTypes";

type CustomerInformationProps = {
  values: CheckoutCustomerData;
  errors: CheckoutFieldErrors;
  onChange: (field: keyof CheckoutCustomerData, value: string) => void;
};

export default function CustomerInformation({
  values,
  errors,
  onChange,
}: CustomerInformationProps) {
  return (
    <section
      className="checkout-section checkout-section--customer"
      aria-labelledby="checkout-customer-title"
    >
      <div className="checkout-section-heading">
        <div className="checkout-section-icon" aria-hidden="true">
          <FontAwesomeIcon icon={faUser} />
        </div>
        <div>
          <h2 id="checkout-customer-title">Customer Details</h2>
          <p>We will use this information to contact you about your request.</p>
        </div>
      </div>

      <div className="checkout-form-grid">
        <div className="checkout-field">
          <label htmlFor="checkout-full-name">Full Name</label>
          <input
            id="checkout-full-name"
            name="fullName"
            type="text"
            value={values.fullName}
            autoComplete="name"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={
              errors.fullName ? "checkout-full-name-error" : undefined
            }
            onChange={(event) => {
              onChange("fullName", event.target.value);
            }}
          />
          {errors.fullName ? (
            <p className="checkout-field-error" id="checkout-full-name-error">
              {errors.fullName}
            </p>
          ) : null}
        </div>

        <div className="checkout-field">
          <label htmlFor="checkout-contact-number">Contact Number</label>
          <div className="checkout-input-with-icon">
            <FontAwesomeIcon icon={faPhone} aria-hidden="true" />
            <input
              id="checkout-contact-number"
              name="contactNumber"
              type="tel"
              value={values.contactNumber}
              placeholder="09XX XXX XXXX"
              autoComplete="tel"
              aria-invalid={Boolean(errors.contactNumber)}
              aria-describedby={
                errors.contactNumber ? "checkout-contact-error" : undefined
              }
              onChange={(event) => {
                onChange("contactNumber", event.target.value);
              }}
            />
          </div>
          {errors.contactNumber ? (
            <p className="checkout-field-error" id="checkout-contact-error">
              {errors.contactNumber}
            </p>
          ) : null}
        </div>

        <div className="checkout-field checkout-field--full">
          <label htmlFor="checkout-email">Email Address</label>
          <div className="checkout-input-with-icon">
            <FontAwesomeIcon icon={faEnvelope} aria-hidden="true" />
            <input
              id="checkout-email"
              name="email"
              type="email"
              value={values.email}
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "checkout-email-error" : undefined}
              onChange={(event) => {
                onChange("email", event.target.value);
              }}
            />
          </div>
          {errors.email ? (
            <p className="checkout-field-error" id="checkout-email-error">
              {errors.email}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
