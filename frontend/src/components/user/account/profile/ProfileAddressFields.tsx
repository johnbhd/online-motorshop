import { faLocationDot } from "@fortawesome/free-solid-svg-icons";

import LocationSelect, { type LocationOption } from "./LocationSelect";

export type ProfileLocationValues = {
  cityCode: string;
  cityName: string;
  barangayCode: string;
  barangayName: string;
};

export const EMPTY_LOCATION_OPTIONS: readonly LocationOption[] = [];

type ProfileAddressFieldsProps = {
  cityCode: string;
  cityName: string;
  barangayCode: string;
  barangayName: string;
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
  cityCode,
  cityName,
  barangayCode,
  barangayName,
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
        key={`city-${cityCode}-${cityName}`}
        id="customer-profile-city"
        label="City / Municipality"
        icon={faLocationDot}
        value={cityCode || cityName}
        displayValue={cityName}
        options={cityOptions}
        placeholder="Select City / Municipality"
        emptyMessage="No cities or municipalities found."
        isLoading={cityLoading}
        error={cityError}
        onRetry={onCityRetry}
        helpText="Search by city or municipality name."
        onChange={onCityChange}
      />
      <LocationSelect
        key={`barangay-${cityCode}-${barangayCode}-${barangayName}`}
        id="customer-profile-barangay"
        label="Barangay"
        icon={faLocationDot}
        value={barangayCode || barangayName}
        displayValue={barangayName}
        options={barangayOptions}
        placeholder={cityCode ? "Select Barangay" : "Select a city first"}
        emptyMessage="No barangays found for this city or municipality."
        isLoading={barangayLoading}
        disabled={!cityCode}
        error={barangayError}
        onRetry={onBarangayRetry}
        helpText={cityCode ? "Options are limited to the selected city or municipality." : "Select a city or municipality first."}
        onChange={onBarangayChange}
      />
    </div>
  );
}
