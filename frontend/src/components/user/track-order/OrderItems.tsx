import Image from "next/image";
import type { TrackOrderItem } from "./trackOrderTypes";

type OrderItemsProps = {
  items: TrackOrderItem[];
};

export default function OrderItems({ items }: OrderItemsProps) {
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
          {items.length} items
        </span>
      </div>
      <div className="track-order-items-list">
        <div className="track-order-items-head" aria-hidden="true">
          <span>Product Details</span>
          <span>Qty</span>
          <span>Price / Status</span>
        </div>
        <ul>
          {items.map(({ product, quantity }) => (
            <li className="track-order-item" key={product.id}>
              <div className="track-order-item-product">
                <div className="track-order-item-image">
                  <Image
                    src={product.image}
                    alt={product.alt}
                    width={88}
                    height={88}
                    sizes="(max-width: 560px) 4.5rem, 5.5rem"
                  />
                </div>
                <div>
                  <span className="track-order-item-part-number">
                    {product.partNumber}
                  </span>
                  <h3>{product.name}</h3>
                  <p>{product.brand} product</p>
                </div>
              </div>
              <div className="track-order-item-quantity">
                <span>Quantity</span>
                <strong>{quantity}</strong>
              </div>
              <div className="track-order-item-price">
                <span>Price / Status</span>
                <strong>To be confirmed</strong>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="track-order-item-note">
        Final pricing, availability, and any applicable fees are confirmed by
        ALD staff before payment.
      </p>
    </section>
  );
}
