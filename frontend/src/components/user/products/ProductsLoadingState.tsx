import type { ProductViewMode } from "./ProductsToolbar";

const SKELETON_COUNT = 6;

type ProductsLoadingStateProps = {
  viewMode: ProductViewMode;
};

export default function ProductsLoadingState({
  viewMode,
}: ProductsLoadingStateProps) {
  return (
    <div
      className={`products-grid products-grid--${viewMode} products-loading-grid`}
      role="status"
      aria-live="polite"
      aria-label="Loading products"
    >
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <article
          className={`products-card products-card--${viewMode} products-skeleton-card`}
          key={index}
          aria-hidden="true"
        >
          <div className="products-card-image products-skeleton-image" />
          <div className="products-card-content products-skeleton-content">
            <span className="products-skeleton-line products-skeleton-line--brand" />
            <span className="products-skeleton-line products-skeleton-line--title" />
            <span className="products-skeleton-line products-skeleton-line--part" />
            <span className="products-skeleton-line products-skeleton-line--description" />
            <span className="products-skeleton-line products-skeleton-line--price" />
            <span className="products-skeleton-line products-skeleton-line--actions" />
            <span className="products-skeleton-line products-skeleton-line--details" />
          </div>
        </article>
      ))}
      <span className="products-sr-only">Loading products...</span>
    </div>
  );
}
