import { faLocationDot } from "@fortawesome/free-solid-svg-icons";

import LocationSelect, { type LocationOption } from "./LocationSelect";

export type ProfileLocationValues = {
  city: string;
  barangay: string;
};

export const EMPTY_LOCATION_OPTIONS: readonly LocationOption[] = [];

type ProfileAddressFieldsProps = {
  city: string;
  barangay: string;
  cityOptions?: readonly LocationOption[];
  barangayOptions?: readonly LocationOption[];
  cityLoading?: boolean;
  barangayLoading?: boolean;
  cityError?: string;
  barangayError?: string;
  onCityRetry?: () => void;
  onBarangayRetry?: () => void;
  onCityChange: (value: string) => void;
  onBarangayChange: (value: string) => void;
};

export default function ProfileAddressFields({
  city,
  barangay,
  cityOptions = EMPTY_LOCATION_OPTIONS,
  barangayOptions = EMPTY_LOCATION_OPTIONS,
  cityLoading = false,
  barangayLoading = false,
  cityError,
  barangayError,
  onCityRetry,
  onBarangayRetry,
  onCityChange,
  onBarangayChange,
}: ProfileAddressFieldsProps) {
  return (
    <div className="customer-profile-location-fields">
      <LocationSelect
        key={`city-${city}`}
        id="customer-profile-city"
        label="City / Municipality"
        icon={faLocationDot}
        value={city}
        options={cityOptions}
        placeholder="Select City / Municipality"
        emptyMessage="No cities available yet."
        isLoading={cityLoading}
        error={cityError}
        onRetry={onCityRetry}
        helpText="Ready for a future PSGC location source."
        onChange={onCityChange}
      />
      <LocationSelect
        key={`barangay-${city}-${barangay}`}
        id="customer-profile-barangay"
        label="Barangay"
        icon={faLocationDot}
        value={barangay}
        options={barangayOptions}
        placeholder={city ? "Select Barangay" : "Select a city first"}
        emptyMessage="No barangays available yet."
        isLoading={barangayLoading}
        disabled={!city}
        error={barangayError}
        onRetry={onBarangayRetry}
        helpText={city ? "Barangay options will load after a location source is connected." : "Select a city first."}
        onChange={onBarangayChange}
      />
    </div>
  );
}
