import type { DemoOrder } from "@/lib/orders/orderTypes";
import CurrentOrderStatus from "../track-order/CurrentOrderStatus";
import OrderActivity from "../track-order/OrderActivity";
import OrderItems from "../track-order/OrderItems";
import OrderProgressTracker from "../track-order/OrderProgressTracker";
import OrderRequestSummary from "../track-order/OrderRequestSummary";
import OrderSummaryCards from "../track-order/OrderSummaryCards";
import OrderSupportSection from "../track-order/OrderSupportSection";
import {
  getOrderProgressCaption,
  getOrderProgressSteps,
  getOrderStatusPresentation,
} from "../track-order/trackOrderData";

type OrderDetailsViewProps = {
  order: DemoOrder;
};

export default function OrderDetailsView({ order }: OrderDetailsViewProps) {
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
