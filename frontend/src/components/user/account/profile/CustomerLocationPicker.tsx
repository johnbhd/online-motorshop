"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationCrosshairs,
  faLocationDot,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { addAldMapBasemap } from "@/lib/mapLibreBasemap";
import { ALD_MAP_MAX_ZOOM, ALD_MAP_MIN_ZOOM } from "@/lib/mapConfig";
import MapFullscreenFrame from "@/components/ui/MapFullscreenFrame";
import { reverseGeocodeLocation } from "@/lib/locationApi";
import type {
  LocationDetectionState,
  ReverseGeocodeResponse,
} from "@/lib/locationTypes";
import type { LatLngExpression, Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

type CustomerLocationPickerProps = {
  latitude: number | null;
  longitude: number | null;
  onChange: (latitude: number | null, longitude: number | null) => void;
  detectionState?: LocationDetectionState;
  onDetected?: (result: ReverseGeocodeResponse) => void;
  onDetectionStateChange?: (state: LocationDetectionState) => void;
  mode?: "profile" | "checkout";
};

const DEFAULT_ZOOM = 16;

function formatCoordinate(value: number) {
  return value.toFixed(6);
}

export default function CustomerLocationPicker({
  latitude,
  longitude,
  onChange,
  detectionState,
  onDetected,
  onDetectionStateChange,
  mode = "profile",
}: CustomerLocationPickerProps) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const onChangeRef = useRef(onChange);
  const onDetectedRef = useRef(onDetected);
  const onDetectionStateChangeRef = useRef(onDetectionStateChange);
  const reverseControllerRef = useRef<AbortController | null>(null);
  const reverseRequestIdRef = useRef(0);
  const [detecting, setDetecting] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedArea, setDetectedArea] = useState<string | null>(null);
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const [internalDetectionState, setInternalDetectionState] = useState<LocationDetectionState>("idle");
  const currentDetectionState = detectionState ?? internalDetectionState;
  const hasCoordinates = latitude !== null && longitude !== null;

  useEffect(() => {
    onChangeRef.current = onChange;
    onDetectedRef.current = onDetected;
    onDetectionStateChangeRef.current = onDetectionStateChange;
  }, [onChange, onDetected, onDetectionStateChange]);

  const setDetectionState = (state: LocationDetectionState) => {
    setInternalDetectionState(state);
    onDetectionStateChangeRef.current?.(state);
  };

  const syncLocation = (nextLatitude: number, nextLongitude: number) => {
    onChangeRef.current(nextLatitude, nextLongitude);
    reverseControllerRef.current?.abort();

    const requestId = reverseRequestIdRef.current + 1;
    reverseRequestIdRef.current = requestId;
    const controller = new AbortController();
    reverseControllerRef.current = controller;
    setDetectionState("detecting");
    setError(null);
    setDetectedArea(null);
    setDetectedCity(null);

    void reverseGeocodeLocation(nextLatitude, nextLongitude, controller.signal)
      .then((result) => {
        if (controller.signal.aborted || requestId !== reverseRequestIdRef.current) {
          return;
        }

        setDetectedArea(result.detected.area);
        setDetectedCity(
          result.psgc.city_municipality ?? result.detected.city_municipality,
        );
        setDetectionState(
          result.match.city === "matched" && result.match.barangay === "matched"
            ? "matched"
            : "partial",
        );
        onDetectedRef.current?.(result);
      })
      .catch((reverseError: unknown) => {
        if (controller.signal.aborted || requestId !== reverseRequestIdRef.current) {
          return;
        }

        setDetectionState("failed");
        setError(
          reverseError instanceof Error && reverseError.message
            ? reverseError.message
            : "The pin was saved, but its address could not be verified. Review the fields manually.",
        );
      });
  };

  const syncLocationRef = useRef(syncLocation);

  useEffect(() => {
    syncLocationRef.current = syncLocation;
  });

  useEffect(() => {
    if (!hasCoordinates || latitude === null || longitude === null) {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
      return;
    }

    let cancelled = false;

    const initializeMap = async () => {
      if (!mapElementRef.current || mapRef.current) {
        return;
      }

      setMapLoading(true);

      try {
        const { default: leaflet } = await import("leaflet");

        if (cancelled || !mapElementRef.current) {
          return;
        }

        const center: LatLngExpression = [latitude, longitude];
        const map = leaflet.map(mapElementRef.current, {
          center,
          maxZoom: ALD_MAP_MAX_ZOOM,
          minZoom: ALD_MAP_MIN_ZOOM,
          zoom: DEFAULT_ZOOM,
          scrollWheelZoom: false,
        });

        const basemap = await addAldMapBasemap(map);

        if (cancelled) {
          map.remove();
          return;
        }

        basemap.maplibre.on("error", () => {
          if (!cancelled) {
            setError("Unable to load map. You can still save your address and delivery information without a map pin.");
          }
        });

        const marker = leaflet
          .marker(center, {
            draggable: true,
            icon: leaflet.divIcon({
              className: "customer-location-marker",
              html: '<span aria-hidden="true"></span>',
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            }),
          })
          .addTo(map);

        map.on("click", (event) => {
          syncLocationRef.current(event.latlng.lat, event.latlng.lng);
        });
        marker.on("dragend", () => {
          const position = marker.getLatLng();
          syncLocationRef.current(position.lat, position.lng);
        });

        mapRef.current = map;
        markerRef.current = marker;
        window.requestAnimationFrame(() => map.invalidateSize());
      } catch {
        if (!cancelled) {
          setError("The map preview could not be loaded. You can still save your address without a map pin.");
        }
      } finally {
        if (!cancelled) {
          setMapLoading(false);
        }
      }
    };

    void initializeMap();

    return () => {
      cancelled = true;
    };
  }, [hasCoordinates, latitude, longitude]);

  useEffect(() => {
    if (
      !hasCoordinates
      || latitude === null
      || longitude === null
      || !mapRef.current
      || !markerRef.current
    ) {
      return;
    }

    const position: LatLngExpression = [latitude, longitude];
    markerRef.current.setLatLng(position);
    mapRef.current.setView(position, mapRef.current.getZoom());
  }, [hasCoordinates, latitude, longitude]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const resizeFrame = window.requestAnimationFrame(() => {
      mapRef.current?.invalidateSize();
    });

    return () => window.cancelAnimationFrame(resizeFrame);
  }, [isMapFullscreen]);

  useEffect(() => {
    return () => {
      reverseControllerRef.current?.abort();
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Your browser cannot detect a location. You can continue without a map pin.");
      return;
    }

    setDetecting(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        syncLocation(position.coords.latitude, position.coords.longitude);
        setDetecting(false);
      },
      (geolocationError) => {
        const message = geolocationError.code === 1
          ? "Location access was not enabled. You can still save your address manually."
          : "We could not detect your current location. You can try again or continue without a map pin.";

        setError(message);
        setDetecting(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      },
    );
  };

  const removeSavedLocation = () => {
    reverseControllerRef.current?.abort();
    reverseRequestIdRef.current += 1;
    setError(null);
    setDetectedArea(null);
    setDetectedCity(null);
    setDetectionState("idle");
    onChangeRef.current(null, null);
  };

  return (
    <section className="customer-location-picker" aria-labelledby="customer-location-title">
      <div className="customer-location-picker-header">
        <div>
          <p className="customer-location-picker-eyebrow">Location — optional</p>
          <h3 id="customer-location-title">{mode === "checkout" ? "Confirm delivery map pin" : "Save a delivery map pin"}</h3>
          <p>{mode === "checkout" ? "Your saved profile pin is shown when available. Changes here apply only to this order." : "Your written address stays primary. This optional pin can be reused later for Lalamove delivery."}</p>
        </div>
        <FontAwesomeIcon icon={faLocationDot} aria-hidden="true" />
      </div>

      <div className="customer-location-picker-actions">
        <button
          type="button"
          className="customer-profile-action customer-profile-action--secondary"
          disabled={detecting}
          onClick={detectCurrentLocation}
        >
          <FontAwesomeIcon icon={faLocationCrosshairs} aria-hidden="true" />
          {detecting ? "Detecting location..." : "Use My Current Location"}
        </button>
        {hasCoordinates ? (
          <button
            type="button"
            className="customer-location-remove"
            onClick={removeSavedLocation}
          >
            <FontAwesomeIcon icon={faTrashCan} aria-hidden="true" />
            Remove saved location
          </button>
        ) : null}
      </div>

      {hasCoordinates ? (
        <MapFullscreenFrame
          title={mode === "checkout" ? "Confirm delivery map pin" : "Saved delivery map pin"}
          mapLabel={mode === "checkout" ? "checkout delivery map" : "saved customer location map"}
          onFullscreenChange={setIsMapFullscreen}
        >
          <div className="customer-location-map-shell">
            <div
              ref={mapElementRef}
              className="customer-location-map"
              aria-label="Saved customer location map. Click the map or drag the pin to adjust the location."
            />
            {mapLoading ? <p className="customer-location-map-status" role="status">Loading map preview...</p> : null}
          </div>
        </MapFullscreenFrame>
      ) : (
        <div className="customer-location-map-shell">
          <div className="customer-location-empty-map">
            <FontAwesomeIcon icon={faLocationDot} aria-hidden="true" />
            <strong>No location pinned yet.</strong>
            <span>Use “Use My Current Location” to add an optional map pin.</span>
          </div>
        </div>
      )}

      {hasCoordinates ? (
        <p className="customer-location-status" role="status">
          <FontAwesomeIcon icon={faLocationDot} aria-hidden="true" />
          Location pinned · {formatCoordinate(latitude)}°, {formatCoordinate(longitude)}°
        </p>
      ) : null}
      {hasCoordinates && currentDetectionState !== "idle" ? (
        <p className={`customer-location-verification customer-location-verification--${currentDetectionState}`} role="status">
          {currentDetectionState === "detecting"
            ? "Checking the pinned city and barangay…"
            : currentDetectionState === "matched"
              ? "Pin matches the selected PSGC city and barangay."
              : currentDetectionState === "partial"
                ? `Location detected${detectedArea ? ` in ${detectedArea}` : ""}${detectedCity ? `, ${detectedCity}` : ""}. We could not determine the exact barangay automatically. Please select or enter your barangay before saving.`
                : currentDetectionState === "manual"
                  ? `Location detected${detectedArea ? ` in ${detectedArea}` : ""}${detectedCity ? `, ${detectedCity}` : ""}. The barangay was completed manually and will be checked when you save.`
                : currentDetectionState === "mismatch"
                  ? "The location fields changed after this pin. Use the map again to verify the new address."
                  : "Pin saved, but its address could not be verified. You can continue with manual fields."}
        </p>
      ) : null}
      {hasCoordinates && detectedArea ? (
        <p className="customer-location-detected-area" role="status">
          Detected area: {detectedArea}
        </p>
      ) : null}
      {error ? <p className="customer-location-error-message" role="alert">{error}</p> : null}
      <p className="customer-location-help">{mode === "checkout" ? "Drag the pin or click the map to adjust this order's delivery location. It will not change your profile." : "Drag the pin or click the map to adjust the saved location. Press Save changes to persist it."}</p>
    </section>
  );
}
