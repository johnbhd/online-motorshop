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
