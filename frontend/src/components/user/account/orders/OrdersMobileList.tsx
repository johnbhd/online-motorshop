import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import type { DemoOrder } from "@/lib/orders/orderTypes";
import { formatOrderTimestamp } from "../../checkout/checkoutUtils";
import OrderStatusBadge from "./OrderStatusBadge";
import {
  getOrderAmountDisplay,
  getOrderFulfillmentSummary,
  getOrderItemLabel,
} from "./customerOrderUtils";

type OrdersMobileListProps = {
  orders: DemoOrder[];
};

function getOrderDetailsHref(reference: string): string {
  return `/account/orders/${encodeURIComponent(reference)}`;
}

export default function OrdersMobileList({ orders }: OrdersMobileListProps) {
  return (
    <div
      className="customer-orders-mobile-list"
      data-view="mobile"
      aria-label="My orders"
    >
      {orders.map((order) => {
        const fulfillment = getOrderFulfillmentSummary(order);

        return (
          <article className="customer-order-card" key={order.reference}>
            <div className="customer-order-card-header">
              <Link
                className="customer-order-reference"
                href={getOrderDetailsHref(order.reference)}
              >
                {order.reference}
              </Link>
              <OrderStatusBadge kind="status" value={order.status} />
            </div>
            <dl className="customer-order-card-details">
              <div>
                <dt>Date</dt>
                <dd>{formatOrderTimestamp(order.createdAt)}</dd>
              </div>
              <div>
                <dt>Items</dt>
                <dd>{getOrderItemLabel(order)}</dd>
              </div>
              <div>
                <dt>Fulfillment</dt>
                <dd>
                  <span>{fulfillment.label}</span>
                  <small>{fulfillment.detail}</small>
                </dd>
              </div>
              <div>
                <dt>Payment</dt>
                <dd>
                  <OrderStatusBadge
                    kind="payment"
                    value={order.paymentStatus}
                  />
                </dd>
              </div>
              <div>
                <dt>Amount</dt>
                <dd>{getOrderAmountDisplay(order)}</dd>
              </div>
            </dl>
            <Link
              className="customer-order-card-action"
              href={getOrderDetailsHref(order.reference)}
            >
              <span>View Details</span>
              <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
            </Link>
          </article>
        );
      })}
    </div>
  );
}
