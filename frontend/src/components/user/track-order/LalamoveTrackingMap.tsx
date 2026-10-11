"use client";

import { useEffect, useMemo, useRef } from "react";
import type { LatLngExpression, Map as LeafletMap, LayerGroup } from "leaflet";
import type { OrderViewDelivery, CustomerOrderBranch } from "@/lib/orders/orderTypes";

type LalamoveTrackingMapProps = {
  branch: CustomerOrderBranch | null;
  delivery: OrderViewDelivery | null;
};

function isCoordinatePair(latitude: number | null | undefined, longitude: number | null | undefined): latitude is number {
  return typeof latitude === "number" && Number.isFinite(latitude)
    && typeof longitude === "number" && Number.isFinite(longitude);
}

function normalizeStatus(status: string) {
  return status.trim().toLowerCase().replace(/[-\s]+/g, "_");
}

function destinationProgress(status: string) {
  switch (normalizeStatus(status)) {
    case "booked":
      return 0.2;
    case "picked_up":
      return 0.55;
    case "in_transit":
      return 0.78;
    case "delivered":
      return 1;
    default:
      return 0;
  }
}

export default function LalamoveTrackingMap({ branch, delivery }: LalamoveTrackingMapProps) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);

  const destination = useMemo(() => delivery && isCoordinatePair(delivery.latitude, delivery.longitude)
    ? [delivery.latitude, delivery.longitude] as [number, number]
    : null, [delivery]);
  const branchLocation = useMemo(() => branch && isCoordinatePair(branch.latitude, branch.longitude)
    ? [branch.latitude, branch.longitude] as [number, number]
    : null, [branch]);

  useEffect(() => {
    if (!destination && !branchLocation) {
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      return;
    }

    let cancelled = false;

    const initialize = async () => {
      if (!mapElementRef.current || mapRef.current) return;

      const { default: leaflet } = await import("leaflet");
      if (cancelled || !mapElementRef.current) return;

      const center: LatLngExpression = destination ?? branchLocation!;
      const map = leaflet.map(mapElementRef.current, {
        center,
        zoom: destination && branchLocation ? 12 : 15,
        scrollWheelZoom: false,
        dragging: false,
        doubleClickZoom: false,
      });
      leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      layerRef.current = leaflet.layerGroup().addTo(map);
      window.requestAnimationFrame(() => map.invalidateSize());
    };

    void initialize();
    return () => {
      cancelled = true;
    };
  }, [branchLocation, destination]);

  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;

    void import("leaflet").then(({ default: leaflet }) => {
      const map = mapRef.current;
      const layer = layerRef.current;
      if (!map || !layer) return;

      layer.clearLayers();
      const points: [number, number][] = [];
      const pin = (color: string, label: string) => leaflet.divIcon({
        className: "lalamove-tracking-marker",
        html: `<span style="--tracking-marker-color:${color}" aria-hidden="true"></span><b>${label}</b>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      if (branchLocation) {
        points.push(branchLocation);
        leaflet.marker(branchLocation, { icon: pin("#0b1930", "ALD") }).addTo(layer).bindTooltip("Selected ALD branch");
      }

      if (destination) {
        points.push(destination);
        leaflet.marker(destination, { icon: pin("#e07a08", "YOU") }).addTo(layer).bindTooltip("Saved delivery location");
      }

      if (branchLocation && destination) {
        leaflet.polyline([branchLocation, destination], {
          color: "#e07a08",
          dashArray: "7 8",
          weight: 3,
        }).addTo(layer);

        const progress = destinationProgress(delivery?.status ?? "");
        const truck: [number, number] = [
          branchLocation[0] + (destination[0] - branchLocation[0]) * progress,
          branchLocation[1] + (destination[1] - branchLocation[1]) * progress,
        ];
        leaflet.marker(truck, { icon: pin("#f59e0b", "") }).addTo(layer).bindTooltip("Illustrative progress marker");
      }

      if (points.length > 1) {
        map.fitBounds(points, { padding: [28, 28] });
      } else if (points[0]) {
        map.setView(points[0], 15);
      }
    });
  }, [branchLocation, delivery?.status, destination]);

  if (!destination && !branchLocation) {
    return (
      <section className="track-order-card track-order-map-card" aria-labelledby="lalamove-map-title">
        <div className="track-order-section-heading">
          <div>
            <p className="track-order-section-eyebrow">DELIVERY LOCATION</p>
            <h2 id="lalamove-map-title">Map preview unavailable</h2>
          </div>
        </div>
        <p className="track-order-map-fallback">This order does not have saved delivery or branch coordinates. The persisted address and delivery status remain available above.</p>
      </section>
    );
  }

  return (
    <section className="track-order-card track-order-map-card" aria-labelledby="lalamove-map-title">
      <div className="track-order-section-heading">
        <div>
          <p className="track-order-section-eyebrow">DELIVERY LOCATION</p>
          <h2 id="lalamove-map-title">Lalamove Delivery Map</h2>
        </div>
        <span className="track-order-progress-caption">Illustrative route</span>
      </div>
      <div ref={mapElementRef} className="track-order-map" aria-label="Read-only map showing the branch and saved delivery location" />
      <p className="track-order-map-note">This map shows the saved order coordinates and a symbolic progress marker. It is not live rider GPS or an ETA.</p>
    </section>
  );
}
