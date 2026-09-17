import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faMinus,
  faPlus,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { formatCartCurrency } from "./cartData";
import type { CartItemData } from "./cartTypes";

type CartItemProps = {
  item: CartItemData;
  onIncrement: (itemId: string) => void;
  onDecrement: (itemId: string) => void;
  onRemove: (itemId: string) => void;
};

export default function CartItem({
  item,
  onIncrement,
  onDecrement,
  onRemove,
}: CartItemProps) {
  const { product } = item;
  const itemSubtotal = item.price * item.quantity;

  return (
    <article className="cart-row">
      <div className="cart-product-cell">
        <div className="cart-item-image">
          <Image
            src={product.image}
            alt={product.alt}
            width={64}
            height={64}
            sizes="64px"
          />
        </div>

        <div className="cart-item-content">
          <h3>{product.name}</h3>
          <dl className="cart-item-details">
            <div>
              <dt>Brand</dt>
              <dd>{product.brand}</dd>
            </div>
            <div>
              <dt>Part Number</dt>
              <dd>{product.partNumber}</dd>
            </div>
            <div>
              <dt>Compatibility</dt>
              <dd>{item.compatibility}</dd>
            </div>
          </dl>

          <div className="cart-badges">
            <span className="cart-stock-badge">
              <FontAwesomeIcon icon={faCircleCheck} aria-hidden="true" />
              Available
            </span>
            <span className="cart-verify-note">
              Compatibility subject to staff verification
            </span>
          </div>
        </div>
      </div>

      <div className="cart-data-cell cart-price-cell">
        <span className="cart-mobile-label">Price</span>
        <span>{formatCartCurrency(item.price)}</span>
      </div>

      <div className="cart-data-cell cart-quantity-cell">
        <span className="cart-mobile-label">Quantity</span>
        <div
          className="cart-quantity-stepper"
          aria-label={`Quantity for ${product.name}`}
        >
          <button
            type="button"
            aria-label={`Decrease quantity for ${product.name}`}
            disabled={item.quantity <= 1}
            onClick={() => onDecrement(product.id)}
          >
            <FontAwesomeIcon icon={faMinus} aria-hidden="true" />
          </button>
          <output aria-live="polite" aria-label={`Current quantity for ${product.name}`}>
            {item.quantity}
          </output>
          <button
            type="button"
            aria-label={`Increase quantity for ${product.name}`}
            onClick={() => onIncrement(product.id)}
          >
            <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="cart-data-cell cart-subtotal-cell">
        <span className="cart-mobile-label">Subtotal</span>
        <strong>{formatCartCurrency(itemSubtotal)}</strong>
      </div>

      <div className="cart-data-cell cart-action-cell">
        <span className="cart-mobile-label">Action</span>
        <button
          className="cart-remove-button"
          type="button"
          aria-label={`Remove ${product.name} from cart`}
          onClick={() => onRemove(product.id)}
        >
          <FontAwesomeIcon icon={faTrashCan} aria-hidden="true" />
          <span>Remove</span>
        </button>
      </div>
    </article>
  );
}
