import type {
  LocationBarangaysResponse,
  LocationCitiesResponse,
  LocationOption,
} from "./locationTypes";

export class LocationApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "LocationApiError";
    this.status = status;
  }
}

async function requestJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    throw new LocationApiError("The location service could not be reached.", 502);
  }

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String(payload.message)
        : `Location request failed with status ${response.status}.`;

    throw new LocationApiError(message, response.status);
  }

  return payload as T;
}

export async function getCitiesMunicipalities(
  signal?: AbortSignal,
): Promise<LocationOption[]> {
  const response = await requestJson<LocationCitiesResponse>(
    "/api/locations/cities-municipalities",
    signal,
  );

  return response.cities_municipalities.map((location) => ({
    value: location.code,
    label: location.name,
    code: location.code,
  }));
}

export async function getBarangaysForCity(
  cityCode: string,
  signal?: AbortSignal,
): Promise<LocationOption[]> {
  const response = await requestJson<LocationBarangaysResponse>(
    `/api/locations/cities-municipalities/${encodeURIComponent(cityCode)}/barangays`,
    signal,
  );

  return response.barangays.map((location) => ({
    value: location.code,
    label: location.name,
    code: location.code,
  }));
}

export function getLocationErrorMessage(
  error: unknown,
  fallback = "Unable to load location options. Please try again.",
): string {
  if (error instanceof LocationApiError) {
    if (error.status >= 500 || error.status === 0) {
      return "Location data is temporarily unavailable. Please try again.";
    }

    if (error.message) return error.message;
  }

  return fallback;
}
