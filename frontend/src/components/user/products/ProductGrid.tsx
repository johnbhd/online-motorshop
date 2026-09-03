import ProductCard from "./ProductCard";
import type { ProductDisplayItem } from "./productsData";
import type { ProductViewMode } from "./ProductsToolbar";

type ProductGridProps = {
  products: ProductDisplayItem[];
  viewMode: ProductViewMode;
};

export default function ProductGrid({
  products,
  viewMode,
}: ProductGridProps) {
  return (
    <div className={`products-grid products-grid--${viewMode}`}>
      {products.map((product) => (
        <ProductCard product={product} viewMode={viewMode} key={product.id} />
      ))}
    </div>
  );
}
