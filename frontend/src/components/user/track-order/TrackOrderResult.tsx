import type { DemoOrder } from "@/lib/orders/orderTypes";
import CurrentOrderStatus from "./CurrentOrderStatus";
import OrderActivity from "./OrderActivity";
import OrderItems from "./OrderItems";
import OrderProgressTracker from "./OrderProgressTracker";
import OrderRequestSummary from "./OrderRequestSummary";
import OrderSummaryCards from "./OrderSummaryCards";
import OrderSupportSection from "./OrderSupportSection";
import {
  getOrderProgressCaption,
  getOrderProgressSteps,
  getOrderStatusPresentation,
} from "./trackOrderData";

type TrackOrderResultProps = {
  order: DemoOrder;
};

export default function TrackOrderResult({ order }: TrackOrderResultProps) {
  const statusPresentation = getOrderStatusPresentation(order.status);
  const progress = getOrderProgressSteps(order);

  return (
    <section
      className="track-order-result-section"
      aria-labelledby="track-order-summary-title"
    >
      <div className="track-order-shell track-order-result">
        <OrderRequestSummary order={order} />
        <OrderProgressTracker
          caption={getOrderProgressCaption(order)}
          steps={progress}
        />
        <CurrentOrderStatus
          status={statusPresentation.label}
          description={statusPresentation.description}
        />
        <OrderSummaryCards order={order} />
        <div className="track-order-detail-grid">
          <div className="track-order-primary-column">
            <OrderItems items={order.items} />
            <OrderActivity activity={order.activities} />
          </div>
          <OrderSupportSection order={order} />
        </div>
      </div>
    </section>
  );
}
