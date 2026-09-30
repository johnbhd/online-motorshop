import type { CheckoutDeliveryData, CheckoutFieldErrors } from "./checkoutTypes";

type DeliveryFieldsProps = {
  values: CheckoutDeliveryData;
  errors: CheckoutFieldErrors;
  onChange: (field: keyof CheckoutDeliveryData, value: string) => void;
};

export default function DeliveryFields({
  values,
  errors,
  onChange,
}: DeliveryFieldsProps) {
  return (
    <section className="checkout-sub-panel checkout-sub-panel--delivery">
      <div className="checkout-sub-panel-heading">
        <h3>Delivery Details</h3>
        <p>
          Lalamove delivery will be arranged manually by ALD staff after the
          request and items are confirmed.
        </p>
      </div>

      <div className="checkout-form-grid">
        <div className="checkout-field checkout-field--full">
          <label htmlFor="checkout-delivery-address">Complete Address</label>
          <input
            id="checkout-delivery-address"
            name="deliveryAddress"
            type="text"
            value={values.address}
            placeholder="House / Building, Street"
            autoComplete="street-address"
            aria-invalid={Boolean(errors.deliveryAddress)}
            aria-describedby={
              errors.deliveryAddress ? "checkout-delivery-address-error" : undefined
            }
            onChange={(event) => {
              onChange("address", event.target.value);
            }}
          />
          {errors.deliveryAddress ? (
            <p
              className="checkout-field-error"
              id="checkout-delivery-address-error"
            >
              {errors.deliveryAddress}
            </p>
          ) : null}
        </div>

        <div className="checkout-field">
          <label htmlFor="checkout-barangay">Barangay</label>
          <input
            id="checkout-barangay"
            name="barangay"
            type="text"
            value={values.barangay}
            autoComplete="address-level3"
            aria-invalid={Boolean(errors.barangay)}
            aria-describedby={errors.barangay ? "checkout-barangay-error" : undefined}
            onChange={(event) => {
              onChange("barangay", event.target.value);
            }}
          />
          {errors.barangay ? (
            <p className="checkout-field-error" id="checkout-barangay-error">
              {errors.barangay}
            </p>
          ) : null}
        </div>

        <div className="checkout-field">
          <label htmlFor="checkout-city">City / Municipality</label>
          <input
            id="checkout-city"
            name="city"
            type="text"
            value={values.city}
            autoComplete="address-level2"
            aria-invalid={Boolean(errors.city)}
            aria-describedby={errors.city ? "checkout-city-error" : undefined}
            onChange={(event) => {
              onChange("city", event.target.value);
            }}
          />
          {errors.city ? (
            <p className="checkout-field-error" id="checkout-city-error">
              {errors.city}
            </p>
          ) : null}
        </div>

        <div className="checkout-field">
          <label htmlFor="checkout-contact-person">Delivery Contact Person</label>
          <input
            id="checkout-contact-person"
            name="contactPerson"
            type="text"
            value={values.contactPerson}
            autoComplete="name"
            aria-invalid={Boolean(errors.contactPerson)}
            aria-describedby={
              errors.contactPerson ? "checkout-contact-person-error" : undefined
            }
            onChange={(event) => {
              onChange("contactPerson", event.target.value);
            }}
          />
          {errors.contactPerson ? (
            <p
              className="checkout-field-error"
              id="checkout-contact-person-error"
            >
              {errors.contactPerson}
            </p>
          ) : null}
        </div>

        <div className="checkout-field">
          <label htmlFor="checkout-delivery-notes">Delivery Notes — Optional</label>
          <input
            id="checkout-delivery-notes"
            name="deliveryNotes"
            type="text"
            value={values.notes}
            placeholder="Landmark or instructions"
            onChange={(event) => {
              onChange("notes", event.target.value);
            }}
          />
        </div>
      </div>
    </section>
  );
}
