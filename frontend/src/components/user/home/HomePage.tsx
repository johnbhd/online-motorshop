import FeaturedProducts from "./FeaturedProducts";
import FinalCta from "./FinalCta";
import FulfillmentSection from "./FulfillmentSection";
import HomeBrands from "./HomeBrands";
import HomeCategories from "./HomeCategories";
import HomeHero from "./HomeHero";
import OrderingSteps from "./OrderingSteps";

export default function HomePage() {
  return (
    <div className="home-page">
      <HomeHero />
      <HomeBrands />
      <HomeCategories />
      <FeaturedProducts />
      <OrderingSteps />
      <FulfillmentSection />
      <FinalCta />
    </div>
  );
}
