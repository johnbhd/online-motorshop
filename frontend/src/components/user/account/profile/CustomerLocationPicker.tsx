"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationCrosshairs,
  faLocationDot,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import type { LatLngExpression, Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

type CustomerLocationPickerProps = {
  latitude: number | null;
  longitude: number | null;
  onChange: (latitude: number | null, longitude: number | null) => void;
};

const DEFAULT_ZOOM = 16;

function formatCoordinate(value: number) {
  return value.toFixed(6);
}

export default function CustomerLocationPicker({
  latitude,
  longitude,
  onChange,
}: CustomerLocationPickerProps) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const onChangeRef = useRef(onChange);
  const [detecting, setDetecting] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasCoordinates = latitude !== null && longitude !== null;

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

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
          zoom: DEFAULT_ZOOM,
          scrollWheelZoom: false,
        });

        leaflet
          .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          })
          .addTo(map);

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
          onChangeRef.current(event.latlng.lat, event.latlng.lng);
        });
        marker.on("dragend", () => {
          const position = marker.getLatLng();
          onChangeRef.current(position.lat, position.lng);
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
    return () => {
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
        onChange(position.coords.latitude, position.coords.longitude);
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
    setError(null);
    onChange(null, null);
  };

  return (
    <section className="customer-location-picker" aria-labelledby="customer-location-title">
      <div className="customer-location-picker-header">
        <div>
          <p className="customer-location-picker-eyebrow">Location — optional</p>
          <h3 id="customer-location-title">Save a delivery map pin</h3>
          <p>Your written address stays primary. This optional pin can be reused later for Lalamove delivery.</p>
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

      <div className="customer-location-map-shell">
        {hasCoordinates ? (
          <div
            ref={mapElementRef}
            className="customer-location-map"
            aria-label="Saved customer location map. Click the map or drag the pin to adjust the location."
          />
        ) : (
          <div className="customer-location-empty-map">
            <FontAwesomeIcon icon={faLocationDot} aria-hidden="true" />
            <strong>No location pinned yet.</strong>
            <span>Use “Use My Current Location” to add an optional map pin.</span>
          </div>
        )}
        {hasCoordinates && mapLoading ? <p className="customer-location-map-status" role="status">Loading map preview...</p> : null}
      </div>

      {hasCoordinates ? (
        <p className="customer-location-status" role="status">
          <FontAwesomeIcon icon={faLocationDot} aria-hidden="true" />
          Location pinned · {formatCoordinate(latitude)}°, {formatCoordinate(longitude)}°
        </p>
      ) : null}
      {error ? <p className="customer-location-error-message" role="alert">{error}</p> : null}
      <p className="customer-location-help">Drag the pin or click the map to adjust the saved location. Press Save changes to persist it.</p>
    </section>
  );
}
