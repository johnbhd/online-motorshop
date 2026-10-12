"use client";

import { useEffect, useState } from "react";
import {
  getTrackedOrder,
  getOrderApiErrorMessage,
  OrderApiError,
  trackOrder,
} from "@/lib/orders/orderApi";
import { toOrderViewModel } from "@/lib/orders/orderAdapter";
import type { OrderViewModel } from "@/lib/orders/orderTypes";
import TrackOrderHero from "./TrackOrderHero";
import TrackOrderResult from "./TrackOrderResult";
import TrackOrderSearch from "./TrackOrderSearch";

const TRACKING_SESSION_STORAGE_KEY = "ald_track_order_session";

type StoredTrackingSession = {
  reference: string;
  token: string;
};

export default function TrackOrderPage() {
  const [matchedOrder, setMatchedOrder] = useState<OrderViewModel | null>(null);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let storedSession: StoredTrackingSession | null = null;

    try {
      const rawSession = window.sessionStorage.getItem(
        TRACKING_SESSION_STORAGE_KEY,
      );
      const parsedSession = rawSession ? JSON.parse(rawSession) : null;

      if (
        parsedSession &&
        typeof parsedSession.reference === "string" &&
        typeof parsedSession.token === "string" &&
        parsedSession.reference.trim() !== "" &&
        parsedSession.token.trim() !== ""
      ) {
        storedSession = parsedSession as StoredTrackingSession;
      }
    } catch {
      window.sessionStorage.removeItem(TRACKING_SESSION_STORAGE_KEY);
    }

    if (!storedSession) {
      return;
    }

    const controller = new AbortController();

    /* eslint-disable react-hooks/set-state-in-effect */
    setIsSearching(true);
    /* eslint-enable react-hooks/set-state-in-effect */

    getTrackedOrder(storedSession.reference, storedSession.token, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) {
          return;
        }

        setMatchedOrder(toOrderViewModel(response.order));
        setTrackingToken(storedSession?.token ?? null);
        setSearchError("");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        window.sessionStorage.removeItem(TRACKING_SESSION_STORAGE_KEY);
        setMatchedOrder(null);
        setTrackingToken(null);
        setSearchError(
          error instanceof OrderApiError && error.status === 404
            ? "Your tracking session has expired. Search for the order again."
            : getOrderApiErrorMessage(
                error,
                "We could not restore this tracked order right now.",
              ),
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      });

    return () => controller.abort();
  }, []);

  const handleSearch = async (reference: string, contactNumber: string) => {
    setMatchedOrder(null);
    setTrackingToken(null);
    setSearchError("");
    setIsSearching(true);
    window.sessionStorage.removeItem(TRACKING_SESSION_STORAGE_KEY);

    try {
      const response = await trackOrder(reference, contactNumber);
      setMatchedOrder(toOrderViewModel(response.order));
      setTrackingToken(response.tracking_token ?? null);

      if (response.tracking_token) {
        window.sessionStorage.setItem(
          TRACKING_SESSION_STORAGE_KEY,
          JSON.stringify({
            reference: response.order.reference,
            token: response.tracking_token,
          } satisfies StoredTrackingSession),
        );
      }
    } catch (error: unknown) {
      if (error instanceof OrderApiError && error.status === 404) {
        setSearchError(
          "Order not found or verification information is incorrect.",
        );
      } else {
        setSearchError(
          getOrderApiErrorMessage(
            error,
            "We could not check your order right now. Please try again.",
          ),
        );
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="track-order-page">
      <TrackOrderHero />
      <section
        className="track-order-search-section"
        aria-labelledby="track-order-search-title"
      >
        <div className="track-order-shell">
          <TrackOrderSearch
            error={searchError}
            isSubmitting={isSearching}
            onSearch={handleSearch}
          />
        </div>
      </section>
      {matchedOrder ? (
        <TrackOrderResult
          order={matchedOrder}
          paymentToken={trackingToken}
          onOrderUpdated={(updatedOrder) => setMatchedOrder(updatedOrder)}
        />
      ) : null}
    </div>
  );
}
