import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import type { ProductDisplayItem } from "@/lib/catalog/catalogTypes";
import { formatCartCurrency } from "../cart/cartData";

type ProductRecommendationsProps = {
  products: ProductDisplayItem[];
};

export default function ProductRecommendations({
  products,
}: ProductRecommendationsProps) {
  return (
    <section
      className="product-details-recommendations"
      aria-labelledby="product-details-recommendations-title"
    >
      <div className="product-details-section-heading product-details-section-heading--row">
        <div>
          <p className="product-details-section-eyebrow">Keep browsing</p>
          <h2 id="product-details-recommendations-title">
            You May Also Like
          </h2>
        </div>
        <span className="product-details-scroll-hint">Scroll to explore</span>
      </div>

      {products.length > 0 ? (
        <div
          className="product-details-recommendation-rail"
          role="list"
          aria-label="Suggested products"
        >
          {products.map((product) => (
            <article
              className="product-details-recommendation-card"
              key={product.id}
              role="listitem"
            >
              <Link
                className="product-details-recommendation-image"
                href={`/products/${encodeURIComponent(product.id)}`}
                aria-label={`View ${product.name}`}
              >
                <Image
                  src={product.image}
                  alt={product.alt}
                  fill
                  sizes="(max-width: 560px) 76vw, (max-width: 900px) 42vw, 17rem"
                />
              </Link>
              <div className="product-details-recommendation-content">
                <p className="product-details-recommendation-brand">
                  {product.brand}
                </p>
                <h3>
                  <Link href={`/products/${encodeURIComponent(product.id)}`}>
                    {product.name}
                  </Link>
                </h3>
                <div className="product-details-recommendation-footer">
                  <span className="product-details-recommendation-price">
                    {product.price > 0
                      ? formatCartCurrency(product.price)
                      : "Price unavailable"}
                  </span>
                  <Link
                    className="product-details-recommendation-link"
                    href={`/products/${encodeURIComponent(product.id)}`}
                    aria-label={`View details for ${product.name}`}
                  >
                    View
                    <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="product-details-recommendation-empty" role="status">
          More products will appear here as the ALD catalog grows.
        </p>
      )}
    </section>
  );
}
