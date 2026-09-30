import type { DemoOrder } from "@/lib/orders/orderTypes";
import OrderDetailsView from "../orders/OrderDetailsView";

type TrackOrderResultProps = {
  order: DemoOrder;
};

export default function TrackOrderResult({ order }: TrackOrderResultProps) {
  return <OrderDetailsView order={order} />;
}
