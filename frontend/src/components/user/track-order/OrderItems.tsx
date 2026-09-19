import Image from "next/image";
import type { DemoOrder, OrderItemSnapshot } from "@/lib/orders/orderTypes";
import { formatCartCurrency, isUsablePrice } from "../cart/cartData";

type OrderItemsProps = {
  order: DemoOrder;
};

function formatOrderAmount(amount: number | null | undefined): string {
  return isUsablePrice(amount)
    ? formatCartCurrency(amount)
    : "Price unavailable";
}

function getUnitPriceLabel(item: OrderItemSnapshot): string {
  return isUsablePrice(item.unitPrice)
    ? formatCartCurrency(item.unitPrice)
    : "Price unavailable";
}

function getLineTotalLabel(item: OrderItemSnapshot): string {
  return isUsablePrice(item.lineTotal)
    ? formatCartCurrency(item.lineTotal)
    : "Price unavailable";
}

export default function OrderItems({ order }: OrderItemsProps) {
  return (
    <section
      className="track-order-card track-order-items-card"
      aria-labelledby="track-order-items-title"
    >
      <div className="track-order-section-heading">
        <div>
          <p className="track-order-section-eyebrow">REQUESTED PRODUCTS</p>
          <h2 id="track-order-items-title">Order Items</h2>
        </div>
        <span className="track-order-section-count">
          {order.items.length} {order.items.length === 1 ? "item" : "items"}
        </span>
      </div>
      <div className="track-order-items-list">
        <div className="track-order-items-head" aria-hidden="true">
          <span>Product Details</span>
          <span>Qty</span>
          <span>Unit Price</span>
          <span>Line Total</span>
        </div>
        <ul>
          {order.items.map((item) => (
            <li className="track-order-item" key={item.product.id}>
              <div className="track-order-item-product">
                <div className="track-order-item-image">
                  <Image
                    src={item.product.image}
                    alt={item.product.alt}
                    width={88}
                    height={88}
                    sizes="(max-width: 560px) 4.5rem, 5.5rem"
                  />
                </div>
                <div>
                  <span className="track-order-item-part-number">
                    {item.product.partNumber}
                  </span>
                  <h3>{item.product.name}</h3>
                  <p>{item.product.brand} product</p>
                </div>
              </div>
              <div className="track-order-item-quantity">
                <span>Quantity</span>
                <strong>{item.quantity}</strong>
              </div>
              <div className="track-order-item-price">
                <span>Unit price</span>
                <strong>{getUnitPriceLabel(item)}</strong>
              </div>
              <div className="track-order-item-line-total">
                <span>Line total</span>
                <strong>{getLineTotalLabel(item)}</strong>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="track-order-pricing-summary">
        <div>
          <span>Subtotal</span>
          <strong>{formatOrderAmount(order.subtotal)}</strong>
        </div>
        <div>
          <span>Estimated total</span>
          <strong>{formatOrderAmount(order.estimatedTotal)}</strong>
        </div>
        {isUsablePrice(order.finalAmount) ? (
          <div>
            <span>Final amount</span>
            <strong>{formatOrderAmount(order.finalAmount)}</strong>
          </div>
        ) : null}
      </div>
      <p className="track-order-item-note">
        Displayed prices are the saved order-request estimate. Final availability,
        pricing, and any applicable fees are confirmed by ALD staff before payment.
      </p>
    </section>
  );
}
