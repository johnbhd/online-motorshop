"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { featuredProducts, homeUtilityIcons } from "../../../data/homeData";
import { getProductById } from "../products/productsData";
import { addProductToCart } from "../cart/cartStorage";
import { formatCartCurrency } from "../cart/cartData";

export default function FeaturedProducts() {
  const router = useRouter();

  const handleAddToCart = (productId: string) => {
    const product = getProductById(productId);

    if (product && addProductToCart(product, 1)) {
      router.push("/cart");
    }
  };

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
          {featuredProducts.map((featuredProduct) => {
            const product = getProductById(featuredProduct.id);

            if (!product) {
              return null;
            }

            return (
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
                  <p className="home-product-price">
                    {product.price > 0
                      ? formatCartCurrency(product.price)
                      : "Price unavailable"}
                  </p>
                </div>
                <button
                  className="home-cart-button"
                  type="button"
                  onClick={() => handleAddToCart(product.id)}
                >
                  <FontAwesomeIcon
                    icon={homeUtilityIcons.cart}
                    aria-hidden="true"
                  />
                  Add to Cart
                </button>
                <Link
                  className="home-product-details"
                  href={`/products/${product.id}`}
                >
                  View Details
                  <FontAwesomeIcon
                    icon={homeUtilityIcons.arrow}
                    aria-hidden="true"
                  />
                </Link>
              </article>
            );
          })}
        </div>

        <Link className="home-primary-cta" href="/products">
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
