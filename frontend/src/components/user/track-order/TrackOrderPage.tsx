"use client";

import { useState } from "react";
import type { DemoOrder } from "@/lib/orders/orderTypes";
import { getDemoOrderByReferenceAndContact } from "../checkout/checkoutUtils";
import TrackOrderHero from "./TrackOrderHero";
import TrackOrderResult from "./TrackOrderResult";
import TrackOrderSearch from "./TrackOrderSearch";

export default function TrackOrderPage() {
  const [matchedOrder, setMatchedOrder] = useState<DemoOrder | null>(null);
  const [searchError, setSearchError] = useState("");

  const handleSearch = (reference: string, contactNumber: string) => {
    setMatchedOrder(null);
    setSearchError("");

    const order = getDemoOrderByReferenceAndContact(
      reference,
      contactNumber,
    );

    if (!order) {
      setSearchError(
        "Order not found or verification information is incorrect.",
      );
      return;
    }

    setMatchedOrder(order);
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
            onSearch={handleSearch}
          />
        </div>
      </section>
      {matchedOrder ? <TrackOrderResult order={matchedOrder} /> : null}
    </div>
  );
}
