import ProductsCatalog from "./ProductsCatalog";
import ProductsHero from "./ProductsHero";

export default function ProductsPage() {
  return (
    <div className="products-page">
      <ProductsHero />
      <ProductsCatalog />
    </div>
  );
}
