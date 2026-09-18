import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import type { ProductDisplayItem } from "../products/productsData";

type ProductOverviewProps = {
  product: ProductDisplayItem;
};

export default function ProductOverview({ product }: ProductOverviewProps) {
  const statusLabel = product.status === "active" ? "Listed" : "Unavailable";

  return (
    <div className="product-details-overview">
      <p className="product-details-brand">{product.brand}</p>
      <h1>{product.name}</h1>

      <div className="product-details-meta" aria-label="Product classification">
        <span className="product-details-category">{product.category}</span>
        <span className="product-details-status">
          <FontAwesomeIcon icon={faCircleCheck} aria-hidden="true" />
          {statusLabel}
        </span>
      </div>

      <p className="product-details-description">{product.description}</p>
    </div>
  );
}
