import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faCartShopping } from "@fortawesome/free-solid-svg-icons";

export default function CartEmptyState() {
  return (
    <div className="cart-empty">
      <span className="cart-empty-icon" aria-hidden="true">
        <FontAwesomeIcon icon={faCartShopping} />
      </span>
      <h2>Your cart is empty</h2>
      <p>Browse motorcycle parts and add items to your cart.</p>
      <Link className="cart-button cart-button--primary" href="/products">
        Browse Products
        <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
      </Link>
    </div>
  );
}
