import { faLocationDot } from "@fortawesome/free-solid-svg-icons";

import LocationSelect, { type LocationOption, type LocationSelection } from "./LocationSelect";

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
  onCityChange: (selection: LocationSelection) => void;
  onBarangayChange: (selection: LocationSelection) => void;
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
        id="customer-profile-city"
        label="City / Municipality"
        icon={faLocationDot}
        value={cityCode || cityName}
        displayValue={cityName}
        options={cityOptions}
        placeholder="Type or select City / Municipality"
        emptyMessage="No cities or municipalities found. You can enter a custom value."
        isLoading={cityLoading}
        error={cityError}
        onRetry={onCityRetry}
        helpText="Search PSGC suggestions or enter a custom city or municipality."
        onChange={onCityChange}
      />
      <LocationSelect
        id="customer-profile-barangay"
        label="Barangay"
        icon={faLocationDot}
        value={barangayCode || barangayName}
        displayValue={barangayName}
        options={barangayOptions}
        placeholder={cityCode ? "Type or select Barangay" : "Enter Barangay"}
        emptyMessage="No barangays found for this city. You can enter a custom value."
        isLoading={barangayLoading}
        error={barangayError}
        onRetry={onBarangayRetry}
        helpText={cityCode ? "Suggestions are limited to the selected city or municipality; custom values are allowed." : "Enter a custom barangay or select an official city to see PSGC suggestions."}
        onChange={onBarangayChange}
      />
    </div>
  );
}
