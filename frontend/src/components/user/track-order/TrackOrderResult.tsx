import type { TrackOrderData } from "./trackOrderTypes";
import CurrentOrderStatus from "./CurrentOrderStatus";
import OrderActivity from "./OrderActivity";
import OrderItems from "./OrderItems";
import OrderProgressTracker from "./OrderProgressTracker";
import OrderRequestSummary from "./OrderRequestSummary";
import OrderSummaryCards from "./OrderSummaryCards";
import OrderSupportSection from "./OrderSupportSection";

type TrackOrderResultProps = {
  order: TrackOrderData;
};

export default function TrackOrderResult({ order }: TrackOrderResultProps) {
  return (
    <section className="track-order-result-section" aria-labelledby="track-order-summary-title">
      <div className="track-order-shell track-order-result">
        <OrderRequestSummary order={order} />
        <OrderProgressTracker steps={order.progress} />
        <CurrentOrderStatus
          status={order.currentStatus}
          description={order.currentStatusDescription}
        />
        <OrderSummaryCards order={order} />
        <div className="track-order-detail-grid">
          <div className="track-order-primary-column">
            <OrderItems items={order.items} />
            <OrderActivity activity={order.activity} />
          </div>
          <OrderSupportSection order={order} />
        </div>
      </div>
    </section>
  );
}
