import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxOpen } from "@fortawesome/free-solid-svg-icons";

export default function ProductsEmptyState() {
  return (
    <div className="products-empty-state" role="status">
      <FontAwesomeIcon icon={faBoxOpen} aria-hidden="true" />
      <h2>No products found</h2>
      <p>Try adjusting your search or filters.</p>
    </div>
  );
}
