"use client";

import { icon } from "@fortawesome/fontawesome-svg-core";
import { faMotorcycle } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LatLngExpression, Map as LeafletMap, LayerGroup } from "leaflet";
import type {
  CustomerOrderBranch,
  OrderViewDelivery,
  OrderViewFulfillment,
} from "@/lib/orders/orderTypes";
import { addAldMapBasemap } from "@/lib/mapLibreBasemap";
import { ALD_MAP_MAX_ZOOM, ALD_MAP_MIN_ZOOM } from "@/lib/mapConfig";
import MapFullscreenFrame from "@/components/ui/MapFullscreenFrame";

type LalamoveTrackingMapProps = {
  branch: CustomerOrderBranch | null;
  delivery: OrderViewDelivery | null;
  fulfillmentMethod: OrderViewFulfillment["method"];
  orderStatus: string;
};

type TrackingMarkerVariant = "point" | "motorcycle";

function normalizeStatus(status: string) {
  return status.trim().toLowerCase().replace(/[-\s]+/g, "_");
}

function destinationProgress(status: string): number | null {
  switch (normalizeStatus(status)) {
    case "waiting_for_booking":
      return 0;
    case "booked":
      return 0.08;
    case "picked_up":
      return 0.25;
    case "in_transit":
      return 0.7;
    case "delivered":
      return 1;
    default:
      return null;
  }
}

function isCoordinatePair(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): latitude is number {
  return typeof latitude === "number" && Number.isFinite(latitude)
    && typeof longitude === "number" && Number.isFinite(longitude);
}

function pointAlongRoute(
  points: [number, number][],
  fraction: number,
): [number, number] | null {
  if (points.length === 0) {
    return null;
  }

  if (points.length === 1 || fraction <= 0) {
    return points[0];
  }

  if (fraction >= 1) {
    return points[points.length - 1];
  }

  const segmentLengths = points.slice(1).map((point, index) => {
    const previous = points[index];
    return Math.hypot(point[0] - previous[0], point[1] - previous[1]);
  });
  const totalLength = segmentLengths.reduce((total, length) => total + length, 0);

  if (totalLength === 0) {
    return points[0];
  }

  let remaining = totalLength * fraction;

  for (let index = 0; index < segmentLengths.length; index += 1) {
    const segmentLength = segmentLengths[index];

    if (remaining <= segmentLength) {
      const start = points[index];
      const end = points[index + 1];
      const segmentFraction = segmentLength === 0 ? 0 : remaining / segmentLength;

      return [
        start[0] + (end[0] - start[0]) * segmentFraction,
        start[1] + (end[1] - start[1]) * segmentFraction,
      ];
    }

    remaining -= segmentLength;
  }

  return points[points.length - 1];
}

function tooltipContent(text: string): HTMLSpanElement {
  const element = document.createElement("span");
  element.textContent = text;
  return element;
}

function getMapContextLabel(
  fulfillmentMethod: OrderViewFulfillment["method"],
  orderStatus: string,
  deliveryStatus: string,
  hasDeliveryProgress: boolean,
) {
  if (fulfillmentMethod === "pickup") {
    return "Store Pickup";
  }

  if (deliveryStatus === "delivered" && hasDeliveryProgress) {
    return "Delivery Complete";
  }

  if (hasDeliveryProgress) {
    return "Delivery Progress";
  }

  if (["rejected", "cancelled"].includes(normalizeStatus(orderStatus))) {
    return "Order Closed";
  }

  return "Route Preview";
}

export default function LalamoveTrackingMap({
  branch,
  delivery,
  fulfillmentMethod,
  orderStatus,
}: LalamoveTrackingMapProps) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const [mapReadyVersion, setMapReadyVersion] = useState(0);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const isPickup = fulfillmentMethod === "pickup";
  const normalizedOrderStatus = normalizeStatus(orderStatus);
  const deliveryStatus = normalizeStatus(delivery?.status ?? "");
  const isOrderConfirmed = ["confirmed", "completed"].includes(normalizedOrderStatus);
  const isOrderClosed = ["rejected", "cancelled"].includes(normalizedOrderStatus);
  const destination = useMemo(() => !isPickup
    && delivery
    && isCoordinatePair(delivery.latitude, delivery.longitude)
    ? [delivery.latitude, delivery.longitude] as [number, number]
    : null, [delivery, isPickup]);
  const branchLocation = useMemo(() => branch && isCoordinatePair(branch.latitude, branch.longitude)
    ? [branch.latitude, branch.longitude] as [number, number]
    : null, [branch]);
  const persistedRoutePoints = useMemo(() => {
    const coordinates = delivery?.routeGeometry?.coordinates;

    if (!Array.isArray(coordinates)) {
      return [];
    }

    return coordinates.reduce<[number, number][]>((points, coordinate) => {
      if (!Array.isArray(coordinate) || coordinate.length < 2) {
        return points;
      }

      const [longitude, latitude] = coordinate;

      if (typeof longitude !== "number" || !Number.isFinite(longitude)
        || typeof latitude !== "number" || !Number.isFinite(latitude)
        || Math.abs(longitude) > 180 || Math.abs(latitude) > 90) {
        return points;
      }

      points.push([latitude, longitude]);
      return points;
    }, []);
  }, [delivery?.routeGeometry]);
  const routePoints = useMemo(() => persistedRoutePoints.length >= 2
    ? persistedRoutePoints
    : branchLocation && destination
      ? [branchLocation, destination]
      : [], [branchLocation, destination, persistedRoutePoints]);
  const hasRoadRoute = persistedRoutePoints.length >= 2;
  const progress = destinationProgress(deliveryStatus);
  const canShowDeliveryProgress = !isPickup
    && isOrderConfirmed
    && progress !== null;
  const shouldDrawRoute = !isPickup
    && !isOrderClosed
    && routePoints.length >= 2;
  const branchMarkerLabel = branch?.name?.trim()
    ? `ALD ${branch.name.trim()}`
    : "ALD";
  const branchTooltip = [
    branch?.name?.trim() ? `ALD Motorshop — ${branch.name.trim()}` : "ALD Motorshop branch",
    branch?.address?.trim(),
  ].filter(Boolean).join(" · ");
  const destinationTooltip = [
    "Delivery Location",
    delivery?.completeAddress?.trim() || delivery?.address?.trim(),
  ].filter(Boolean).join(" · ");
  const mapContextLabel = getMapContextLabel(
    fulfillmentMethod,
    orderStatus,
    deliveryStatus,
    canShowDeliveryProgress,
  );
  const mapTitle = isPickup ? "Pickup Branch Location" : "Lalamove Delivery Map";
  const mapEyebrow = isPickup ? "PICKUP LOCATION" : "DELIVERY LOCATION";
  const mapAriaLabel = isPickup
    ? "Map showing the selected ALD pickup branch"
    : "Interactive map showing the selected ALD branch and saved delivery location";
  const mapErrorMessage = isPickup
    ? "Unable to load the branch map. The selected pickup branch remains available in the order summary."
    : "Unable to load map. Your saved address and delivery information are still available.";

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

      try {
        const { default: leaflet } = await import("leaflet");
        if (cancelled || !mapElementRef.current) return;

        const center: LatLngExpression = destination ?? branchLocation!;
        const map = leaflet.map(mapElementRef.current, {
          center,
          maxZoom: ALD_MAP_MAX_ZOOM,
          minZoom: ALD_MAP_MIN_ZOOM,
          zoom: destination && branchLocation ? 12 : 15,
          scrollWheelZoom: true,
          dragging: true,
          doubleClickZoom: true,
        });

        const basemap = await addAldMapBasemap(map);

        if (cancelled) {
          map.remove();
          return;
        }

        basemap.maplibre.on("error", () => {
          if (!cancelled) {
            setMapError(mapErrorMessage);
          }
        });

        mapRef.current = map;
        layerRef.current = leaflet.layerGroup().addTo(map);
        setMapReadyVersion((version) => version + 1);
        setMapError(null);
        window.requestAnimationFrame(() => map.invalidateSize());
      } catch {
        if (!cancelled) {
          setMapError(mapErrorMessage);
        }
      }
    };

    void initialize();
    return () => {
      cancelled = true;
    };
  }, [branchLocation, destination, mapErrorMessage]);

  useEffect(() => {
    if (!mapReadyVersion || !mapRef.current || !layerRef.current) return;

    void import("leaflet").then(({ default: leaflet }) => {
      const map = mapRef.current;
      const layer = layerRef.current;
      if (!map || !layer) return;

      layer.clearLayers();
      const points: [number, number][] = [];
      const pin = (
        color: string,
        label: string,
        variant: TrackingMarkerVariant = "point",
      ) => leaflet.divIcon({
        className: variant === "motorcycle"
          ? "lalamove-tracking-marker lalamove-tracking-marker--motorcycle"
          : "lalamove-tracking-marker",
        html: variant === "motorcycle"
          ? `<span style="--tracking-marker-color:${color}" aria-hidden="true">${icon(faMotorcycle).html.join("")}</span><b>${label}</b>`
          : `<span style="--tracking-marker-color:${color}" aria-hidden="true"></span><b>${label}</b>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      if (branchLocation) {
        points.push(branchLocation);
        leaflet.marker(branchLocation, { icon: pin("#0b1930", branchMarkerLabel) }).addTo(layer).bindTooltip(tooltipContent(branchTooltip));
      }

      if (destination) {
        points.push(destination);
        leaflet.marker(destination, { icon: pin("#e07a08", "YOU") }).addTo(layer).bindTooltip(tooltipContent(destinationTooltip));
      }

      if (shouldDrawRoute) {
        leaflet.polyline(routePoints, {
          color: canShowDeliveryProgress ? "#e07a08" : "#94a3b8",
          dashArray: hasRoadRoute ? "10 7" : (canShowDeliveryProgress ? "7 8" : "4 8"),
          opacity: canShowDeliveryProgress ? 1 : 0.9,
          weight: 3,
        }).addTo(layer);

        if (canShowDeliveryProgress && progress !== null) {
          const motorcycle = pointAlongRoute(routePoints, progress);

          if (motorcycle) {
            leaflet
              .marker(motorcycle, { icon: pin("#f59e0b", "", "motorcycle") })
              .addTo(layer)
              .bindTooltip(tooltipContent("Suggested delivery progress — not live GPS"));
          }
        }
      }

      const boundsPoints = [...points, ...routePoints];

      if (boundsPoints.length > 1) {
        map.fitBounds(boundsPoints, { padding: [28, 28] });
      } else if (points[0]) {
        map.setView(points[0], 15);
      }
    });
  }, [
    branchLocation,
    canShowDeliveryProgress,
    destination,
    destinationTooltip,
    hasRoadRoute,
    branchMarkerLabel,
    branchTooltip,
    mapReadyVersion,
    progress,
    routePoints,
    shouldDrawRoute,
  ]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const resizeFrame = window.requestAnimationFrame(() => {
      mapRef.current?.invalidateSize();
    });

    return () => window.cancelAnimationFrame(resizeFrame);
  }, [isMapFullscreen]);

  if (!destination && !branchLocation) {
    const fallbackMessage = isPickup
      ? "The selected pickup branch does not have saved coordinates. Its address remains available in the order summary."
      : "This order does not have saved delivery or branch coordinates. The persisted address and delivery status remain available above.";

    return (
      <section className="track-order-card track-order-map-card" aria-labelledby="fulfillment-map-title">
        <div className="track-order-section-heading">
          <div>
            <p className="track-order-section-eyebrow">{mapEyebrow}</p>
            <h2 id="fulfillment-map-title">Map preview unavailable</h2>
          </div>
          <span className="track-order-progress-caption">{mapContextLabel}</span>
        </div>
        <p className="track-order-map-fallback">{fallbackMessage}</p>
      </section>
    );
  }

  return (
    <section className="track-order-card track-order-map-card" aria-labelledby="fulfillment-map-title">
      <div className="track-order-section-heading">
        <div>
          <p className="track-order-section-eyebrow">{mapEyebrow}</p>
          <h2 id="fulfillment-map-title">{mapTitle}</h2>
        </div>
        <span className="track-order-progress-caption">{mapContextLabel}</span>
      </div>
      {isPickup && branch ? (
        <p className="track-order-map-branch">
          <strong>{branch.name}</strong>
          {branch.address ? ` - ${branch.address}` : null}
        </p>
      ) : null}
      <MapFullscreenFrame
        title={mapTitle}
        mapLabel={isPickup ? "pickup branch map" : "Lalamove delivery map"}
        onFullscreenChange={setIsMapFullscreen}
      >
        <div ref={mapElementRef} className="track-order-map" aria-label={mapAriaLabel} />
      </MapFullscreenFrame>
      {mapError ? <p className="track-order-map-error" role="alert">{mapError}</p> : null}
      <p className="track-order-map-note">
        {isPickup
          ? "Pan or zoom the map to inspect the selected ALD branch. Store pickup does not use a delivery route or rider tracking."
          : canShowDeliveryProgress
            ? "Pan or zoom the map to inspect the saved order coordinates and symbolic delivery progress. It is not live rider GPS or an ETA."
            : isOrderClosed
              ? "This order is closed. The saved branch and delivery location are shown for context only."
              : "This route preview shows the selected ALD branch and saved delivery location. Delivery tracking begins after ALD staff confirms the order request."}
      </p>
    </section>
  );
}
