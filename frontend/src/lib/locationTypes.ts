export type LocationOption = {
  value: string;
  label: string;
  code?: string;
};

export type LocationCity = {
  code: string;
  name: string;
  region_code: string | null;
  province_code: string | null;
  geographic_level: string;
};

export type LocationCitiesResponse = {
  cities_municipalities: LocationCity[];
  meta: { total: number };
};

export type LocationBarangay = {
  code: string;
  name: string;
};

export type LocationBarangaysResponse = {
  city_municipality: LocationCity;
  barangays: LocationBarangay[];
};

export type LocationDetectionState =
  | "idle"
  | "detecting"
  | "matched"
  | "partial"
  | "failed"
  | "mismatch";

export type ReverseGeocodeResponse = {
  latitude: number;
  longitude: number;
  detected: {
    city_municipality: string | null;
    barangay: string | null;
  };
  psgc: {
    city_municipality: string | null;
    city_municipality_code: string | null;
    barangay: string | null;
    barangay_code: string | null;
  };
  match: {
    city: "matched" | "unmatched";
    barangay: "matched" | "unmatched";
  };
};
