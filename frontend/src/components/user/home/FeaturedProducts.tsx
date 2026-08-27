import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { featuredProducts, homeUtilityIcons } from "./homeData";

export default function FeaturedProducts() {
  return (
    <section
      className="home-section home-products"
      id="home-products"
      aria-labelledby="home-products-title"
    >
      <div className="home-shell">
        <div className="home-section-heading home-section-heading--center">
          <p className="home-eyebrow home-eyebrow--light">
            Featured Products
          </p>
          <h2 id="home-products-title">Popular Motorcycle Parts</h2>
          <p>
            Browse selected motorcycle parts and maintenance products available
            from ALD Motorshop.
          </p>
        </div>

        <div className="home-product-grid">
          {featuredProducts.map((product) => (
            <article className="home-product-card" key={product.id}>
              <span className="home-product-category">{product.category}</span>
              <div className="home-product-image">
                <Image
                  src={product.image}
                  alt={product.alt}
                  fill
                  sizes="(max-width: 760px) 100vw, (max-width: 1040px) 50vw, 33vw"
                />
              </div>
              <div className="home-product-content">
                <h3>{product.name}</h3>
                <p className="home-product-brand">{product.brand}</p>
                <p className="home-product-price">{product.price}</p>
                <span className="home-stock-badge">
                  <span aria-hidden="true" />
                  {product.stockStatus}
                </span>
              </div>
              <button className="home-cart-button" type="button">
                <FontAwesomeIcon
                  icon={homeUtilityIcons.cart}
                  aria-hidden="true"
                />
                Add to Cart
              </button>
              <Link className="home-product-details" href={product.href}>
                View Details
                <FontAwesomeIcon
                  icon={homeUtilityIcons.arrow}
                  aria-hidden="true"
                />
              </Link>
            </article>
          ))}
        </div>

        <Link className="home-primary-cta" href="/#home-products">
          View All Products
          <FontAwesomeIcon
            icon={homeUtilityIcons.arrow}
            aria-hidden="true"
          />
        </Link>
      </div>
    </section>
  );
}
