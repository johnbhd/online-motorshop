import CartEmptyState from "./CartEmptyState";
import CartItem from "./CartItem";
import type { CartItemData } from "./cartTypes";

type CartItemsProps = {
  items: CartItemData[];
  onIncrement: (itemId: string) => void;
  onDecrement: (itemId: string) => void;
  onRemove: (itemId: string) => void;
};

export default function CartItems({
  items,
  onIncrement,
  onDecrement,
  onRemove,
}: CartItemsProps) {
  return (
    <section className="cart-items-section" aria-labelledby="cart-items-title">
      <h2 className="cart-visually-hidden" id="cart-items-title">
        Selected products
      </h2>

      {items.length === 0 ? (
        <CartEmptyState />
      ) : (
        <div className="cart-table">
          <div className="cart-table-head" aria-hidden="true">
            <span>Product</span>
            <span>Price</span>
            <span>Quantity</span>
            <span>Subtotal</span>
            <span>Action</span>
          </div>

          <div className="cart-item-list">
            {items.map((item) => (
              <CartItem
                key={item.product.id}
                item={item}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
                onRemove={onRemove}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
