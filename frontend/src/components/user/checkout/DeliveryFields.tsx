import { faLocationDot } from "@fortawesome/free-solid-svg-icons";
import type { LocationOption, LocationSelection } from "../account/profile/LocationSelect";
import CustomerLocationPicker from "../account/profile/CustomerLocationPicker";
import LocationSelect from "../account/profile/LocationSelect";
import type { CheckoutDeliveryData, CheckoutFieldErrors } from "./checkoutTypes";

type DeliveryFieldsProps = {
  values: CheckoutDeliveryData;
  errors: CheckoutFieldErrors;
  cityOptions?: readonly LocationOption[];
  barangayOptions?: readonly LocationOption[];
  cityLoading?: boolean;
  barangayLoading?: boolean;
  cityError?: string | null;
  barangayError?: string | null;
  onCityRetry?: () => void;
  onBarangayRetry?: () => void;
  onChange: (field: keyof CheckoutDeliveryData, value: string) => void;
  onLocationChange?: (field: "city" | "barangay", selection: LocationSelection) => void;
  onCoordinatesChange?: (latitude: number | null, longitude: number | null) => void;
};

export default function DeliveryFields({
  values,
  errors,
  cityOptions = [],
  barangayOptions = [],
  cityLoading = false,
  barangayLoading = false,
  cityError,
  barangayError,
  onCityRetry,
  onBarangayRetry,
  onChange,
  onLocationChange,
  onCoordinatesChange,
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

        {onLocationChange ? (
          <>
            <div className="checkout-field">
              <LocationSelect
                id="checkout-city"
                label="City / Municipality"
                icon={faLocationDot}
                value={values.cityMunicipalityCode || values.city}
                displayValue={values.city}
                options={cityOptions}
                placeholder={cityLoading ? "Loading cities..." : "Type or select City / Municipality"}
                emptyMessage="No city suggestions found. A custom value can still be saved."
                isLoading={cityLoading}
                error={cityError ?? errors.city}
                onRetry={onCityRetry}
                helpText="Search PSGC suggestions or enter a custom city or municipality."
                onChange={(selection) => onLocationChange("city", selection)}
              />
            </div>
            <div className="checkout-field">
              <LocationSelect
                id="checkout-barangay"
                label="Barangay"
                icon={faLocationDot}
                value={values.barangayCode || values.barangay}
                displayValue={values.barangay}
                options={barangayOptions}
                placeholder={barangayLoading ? "Loading barangays..." : "Type or select Barangay"}
                emptyMessage="No barangay suggestions found. A custom value can still be saved."
                isLoading={barangayLoading}
                disabled={!values.city}
                error={barangayError ?? errors.barangay}
                onRetry={onBarangayRetry}
                helpText="Suggestions are limited to the selected city when a PSGC city is available."
                onChange={(selection) => onLocationChange("barangay", selection)}
              />
            </div>
          </>
        ) : (
          <>
            <div className="checkout-field">
              <label htmlFor="checkout-barangay">Barangay</label>
              <input id="checkout-barangay" name="barangay" type="text" value={values.barangay} autoComplete="address-level3" aria-invalid={Boolean(errors.barangay)} onChange={(event) => onChange("barangay", event.target.value)} />
              {errors.barangay ? <p className="checkout-field-error">{errors.barangay}</p> : null}
            </div>
            <div className="checkout-field">
              <label htmlFor="checkout-city">City / Municipality</label>
              <input id="checkout-city" name="city" type="text" value={values.city} autoComplete="address-level2" aria-invalid={Boolean(errors.city)} onChange={(event) => onChange("city", event.target.value)} />
              {errors.city ? <p className="checkout-field-error">{errors.city}</p> : null}
            </div>
          </>
        )}

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
          <label htmlFor="checkout-delivery-contact-number">Delivery Contact Number</label>
          <input
            id="checkout-delivery-contact-number"
            name="deliveryContactNumber"
            type="tel"
            value={values.contactNumber}
            autoComplete="tel"
            placeholder="Contact number for the rider"
            aria-invalid={Boolean(errors.deliveryContactNumber)}
            aria-describedby={errors.deliveryContactNumber ? "checkout-delivery-contact-number-error" : undefined}
            onChange={(event) => onChange("contactNumber", event.target.value)}
          />
          {errors.deliveryContactNumber ? <p className="checkout-field-error" id="checkout-delivery-contact-number-error">{errors.deliveryContactNumber}</p> : null}
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

      {onCoordinatesChange ? (
        <CustomerLocationPicker
          latitude={values.latitude}
          longitude={values.longitude}
          mode="checkout"
          onChange={onCoordinatesChange}
        />
      ) : null}
    </section>
  );
}
