import type { OrderViewModel } from "@/lib/orders/orderTypes";
import OrderDetailsView from "../orders/OrderDetailsView";

type TrackOrderResultProps = {
  order: OrderViewModel;
};

export default function TrackOrderResult({ order }: TrackOrderResultProps) {
  return <OrderDetailsView order={order} />;
}
