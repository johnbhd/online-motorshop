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
  | "manual"
  | "failed"
  | "mismatch";

export type LocationDetectionBaseline = {
  cityName: string;
  cityCode: string;
  cityMatched: boolean;
  barangayName: string;
  barangayCode: string;
  barangayMatched: boolean;
};

export type ReverseGeocodeResponse = {
  latitude: number;
  longitude: number;
  detected: {
    city_municipality: string | null;
    barangay: string | null;
    area: string | null;
  };
  psgc: {
    city_municipality: string | null;
    city_municipality_code: string | null;
    barangay: string | null;
    barangay_code: string | null;
  };
  match: {
    city: "matched" | "unmatched";
    barangay: "matched" | "unresolved";
  };
};

export type LocationSelectionValue = {
  label: string;
  code?: string;
};

export function locationDetectionBaselineFromResult(
  result: ReverseGeocodeResponse,
): LocationDetectionBaseline {
  return {
    cityName: result.psgc.city_municipality
      ?? result.detected.city_municipality
      ?? "",
    cityCode: result.psgc.city_municipality_code ?? "",
    cityMatched: result.match.city === "matched",
    barangayName: result.psgc.barangay ?? result.detected.barangay ?? "",
    barangayCode: result.psgc.barangay_code ?? "",
    barangayMatched: result.match.barangay === "matched"
      && result.psgc.barangay !== null,
  };
}

export function locationNamesMatch(left: string, right: string): boolean {
  const normalize = (value: string) => value
    .trim()
    .toLowerCase()
    .replace(/^city\s+of\s+/, "")
    .replace(/\s+(city|municipality)$/, "");

  return normalize(left) !== "" && normalize(left) === normalize(right);
}

export function locationSelectionMatchesDetectedCity(
  selection: LocationSelectionValue,
  baseline: LocationDetectionBaseline,
): boolean {
  if (!baseline.cityMatched) {
    return true;
  }

  const selectedCode = selection.code?.trim() ?? "";

  if (selectedCode !== "" && baseline.cityCode !== "") {
    return selectedCode === baseline.cityCode;
  }

  if (selection.label.trim() === "" || baseline.cityName.trim() === "") {
    return true;
  }

  return locationNamesMatch(selection.label, baseline.cityName);
}

export function locationSelectionMatchesDetectedBarangay(
  selection: LocationSelectionValue,
  baseline: LocationDetectionBaseline,
): boolean {
  if (!baseline.barangayMatched) {
    return true;
  }

  const selectedCode = selection.code?.trim() ?? "";

  if (selectedCode !== "" && baseline.barangayCode !== "") {
    return selectedCode === baseline.barangayCode;
  }

  if (selection.label.trim() === "" || baseline.barangayName.trim() === "") {
    return true;
  }

  return locationNamesMatch(selection.label, baseline.barangayName);
}

export function resolveLocationDetectionState(
  baseline: LocationDetectionBaseline | null,
  city: LocationSelectionValue,
  barangay: LocationSelectionValue,
): LocationDetectionState {
  if (!baseline) {
    return "idle";
  }

  if (
    !locationSelectionMatchesDetectedCity(city, baseline)
    || !locationSelectionMatchesDetectedBarangay(barangay, baseline)
  ) {
    return "mismatch";
  }

  if (!barangay.label.trim()) {
    return "partial";
  }

  return baseline.barangayMatched ? "matched" : "manual";
}
