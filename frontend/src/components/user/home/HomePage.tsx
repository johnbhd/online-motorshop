import FeaturedProducts from "./FeaturedProducts";
import FinalCta from "./FinalCta";
import FulfillmentSection from "./FulfillmentSection";
import HomeBrands from "./HomeBrands";
import HomeCategories from "./HomeCategories";
import HomeHero from "./HomeHero";
import OrderingSteps from "./OrderingSteps";
import {
  getCatalogCategories,
  getCatalogProducts,
} from "@/lib/catalog/catalogQueries";
import { featuredProductIds } from "../../../data/homeData";
import type { ProductDisplayItem } from "@/lib/catalog/catalogTypes";
import type { CatalogCategory } from "@/lib/catalog/catalogTypes";

export default async function HomePage() {
  let featuredProducts: ProductDisplayItem[] = [];
  let categories: CatalogCategory[] = [];
  let catalogError = "";

  try {
    const [result, catalogCategories] = await Promise.all([
      getCatalogProducts({ perPage: 100 }),
      getCatalogCategories(),
    ]);
    const featuredIds = new Set(featuredProductIds);

    featuredProducts = result.products.filter((product) =>
      featuredIds.has(product.partNumber as (typeof featuredProductIds)[number]),
    );
    categories = catalogCategories;
  } catch (error) {
    catalogError = error instanceof Error ? error.message : "Catalog unavailable";
  }

  return (
    <div className="home-page">
      <HomeHero />
      <HomeBrands />
      <HomeCategories categories={categories} error={catalogError} />
      <FeaturedProducts products={featuredProducts} error={catalogError} />
      <OrderingSteps />
      <FulfillmentSection />
      <FinalCta />
    </div>
  );
}
