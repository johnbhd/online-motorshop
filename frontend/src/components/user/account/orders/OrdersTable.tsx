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

type OrdersTableProps = {
  orders: DemoOrder[];
};

function getOrderDetailsHref(reference: string): string {
  return `/account/orders/${encodeURIComponent(reference)}`;
}

export default function OrdersTable({ orders }: OrdersTableProps) {
  return (
    <div className="customer-orders-table-wrap" data-view="desktop">
      <table className="customer-orders-table">
        <caption className="customer-orders-visually-hidden">
          My orders
        </caption>
        <thead>
          <tr>
            <th scope="col">Order Reference</th>
            <th scope="col">Date</th>
            <th scope="col">Items</th>
            <th scope="col">Fulfillment</th>
            <th scope="col">Payment</th>
            <th scope="col">Status</th>
            <th scope="col">Amount</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const fulfillment = getOrderFulfillmentSummary(order);

            return (
              <tr key={order.reference}>
                <th scope="row">
                  <Link
                    className="customer-order-reference"
                    href={getOrderDetailsHref(order.reference)}
                  >
                    {order.reference}
                  </Link>
                </th>
                <td>{formatOrderTimestamp(order.createdAt)}</td>
                <td>{getOrderItemLabel(order)}</td>
                <td>
                  <strong className="customer-order-primary-text">
                    {fulfillment.label}
                  </strong>
                  <span className="customer-order-secondary-text">
                    {fulfillment.detail}
                  </span>
                </td>
                <td>
                  <OrderStatusBadge
                    kind="payment"
                    value={order.paymentStatus}
                  />
                </td>
                <td>
                  <OrderStatusBadge kind="status" value={order.status} />
                </td>
                <td>
                  <span className="customer-order-amount">
                    {getOrderAmountDisplay(order)}
                  </span>
                </td>
                <td>
                  <Link
                    className="customer-order-details-link"
                    href={getOrderDetailsHref(order.reference)}
                  >
                    <span>View Details</span>
                    <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
