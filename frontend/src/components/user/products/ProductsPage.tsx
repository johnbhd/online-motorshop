import ProductsCatalog from "./ProductsCatalogRemote";
import ProductsHero from "./ProductsHero";

type ProductsPageProps = {
  initialCategory?: string;
};

export default function ProductsPage({
  initialCategory,
}: ProductsPageProps) {
  return (
    <div className="products-page">
      <ProductsHero />
      <ProductsCatalog initialCategory={initialCategory} />
    </div>
  );
}
