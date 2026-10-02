"use client";

import { useState } from "react";
import {
  getOrderApiErrorMessage,
  OrderApiError,
  trackOrder,
} from "@/lib/orders/orderApi";
import { toOrderViewModel } from "@/lib/orders/orderAdapter";
import type { OrderViewModel } from "@/lib/orders/orderTypes";
import TrackOrderHero from "./TrackOrderHero";
import TrackOrderResult from "./TrackOrderResult";
import TrackOrderSearch from "./TrackOrderSearch";

export default function TrackOrderPage() {
  const [matchedOrder, setMatchedOrder] = useState<OrderViewModel | null>(null);
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (reference: string, contactNumber: string) => {
    setMatchedOrder(null);
    setSearchError("");
    setIsSearching(true);

    try {
      const response = await trackOrder(reference, contactNumber);
      setMatchedOrder(toOrderViewModel(response.order));
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
      {matchedOrder ? <TrackOrderResult order={matchedOrder} /> : null}
    </div>
  );
}
