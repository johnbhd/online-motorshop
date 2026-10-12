import type { OrderViewModel } from "@/lib/orders/orderTypes";
import OrderDetailsView from "../orders/OrderDetailsView";

type TrackOrderResultProps = {
  order: OrderViewModel;
  paymentToken?: string | null;
  onOrderUpdated?: (order: OrderViewModel) => void;
};

export default function TrackOrderResult({
  order,
  paymentToken,
  onOrderUpdated,
}: TrackOrderResultProps) {
  return (
    <OrderDetailsView
      order={order}
      paymentToken={paymentToken}
      paymentTokenType="tracking"
      onOrderUpdated={onOrderUpdated}
    />
  );
}
