import { demoTrackOrder } from "./trackOrderData";
import TrackOrderHero from "./TrackOrderHero";
import TrackOrderResult from "./TrackOrderResult";
import TrackOrderSearch from "./TrackOrderSearch";

export default function TrackOrderPage() {
  return (
    <div className="track-order-page">
      <TrackOrderHero />
      <section
        className="track-order-search-section"
        aria-labelledby="track-order-search-title"
      >
        <div className="track-order-shell">
          <TrackOrderSearch />
        </div>
      </section>
      <TrackOrderResult order={demoTrackOrder} />
    </div>
  );
}
