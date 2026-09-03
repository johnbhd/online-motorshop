import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGrip,
  faList,
} from "@fortawesome/free-solid-svg-icons";

export type ProductSortOption = "featured" | "price-asc" | "price-desc";
export type ProductViewMode = "grid" | "list";

type ProductsToolbarProps = {
  resultStart: number;
  resultEnd: number;
  totalCount: number;
  sort: ProductSortOption;
  onSortChange: (sort: ProductSortOption) => void;
  viewMode: ProductViewMode;
  onViewModeChange: (viewMode: ProductViewMode) => void;
};

export default function ProductsToolbar({
  resultStart,
  resultEnd,
  totalCount,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
}: ProductsToolbarProps) {
  return (
    <div className="products-toolbar">
      <p className="products-results-count" aria-live="polite">
        Showing {resultStart}-{resultEnd} of {totalCount} products
      </p>

      <div className="products-toolbar-controls">
        <label className="products-sort-label" htmlFor="products-sort">
          <span>Sort by</span>
          <select
            id="products-sort"
            value={sort}
            onChange={(event) =>
              onSortChange(event.target.value as ProductSortOption)
            }
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </label>

        <div className="products-view-toggle" aria-label="Product view">
          <button
            className={`products-view-button${viewMode === "grid" ? " is-active" : ""}`}
            type="button"
            onClick={() => onViewModeChange("grid")}
            aria-label="Grid view"
            aria-pressed={viewMode === "grid"}
          >
            <FontAwesomeIcon icon={faGrip} aria-hidden="true" />
          </button>
          <button
            className={`products-view-button${viewMode === "list" ? " is-active" : ""}`}
            type="button"
            onClick={() => onViewModeChange("list")}
            aria-label="List view"
            aria-pressed={viewMode === "list"}
          >
            <FontAwesomeIcon icon={faList} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
