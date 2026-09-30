import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faClockRotateLeft,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import type { CustomerOrderTab } from "./customerOrderUtils";

type OrdersEmptyStateProps = {
  tab: CustomerOrderTab;
};

export default function OrdersEmptyState({ tab }: OrdersEmptyStateProps) {
  const isActive = tab === "active";

  return (
    <section
      className="customer-orders-empty"
    >
      <div className="customer-orders-empty-icon" aria-hidden="true">
        <FontAwesomeIcon icon={isActive ? faBoxOpen : faClockRotateLeft} />
      </div>
      <h2>{isActive ? "No active orders" : "No order history yet"}</h2>
      <p>
        {isActive
          ? "You have no active order requests right now."
          : "All of your submitted order requests appear here with their current status."}
      </p>
      <Link className="customer-orders-primary-link" href="/products">
        <span>Shop Motorcycle Parts</span>
        <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
      </Link>
    </section>
  );
}
