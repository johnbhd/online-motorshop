import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { homeCategories, homeUtilityIcons } from "../../../data/homeData";
import type { CatalogCategory } from "@/lib/catalog/catalogTypes";

type HomeCategoriesProps = {
  categories: CatalogCategory[];
  error?: string;
};

export default function HomeCategories({
  categories,
  error,
}: HomeCategoriesProps) {
  const presentationByName = new Map(
    homeCategories.map((category) => [category.name, category]),
  );

  return (
    <section
      className="home-section home-categories"
      id="home-categories"
      aria-labelledby="home-categories-title"
    >
      <div className="home-shell">
        <div className="home-section-heading home-section-heading--center">
          <p className="home-eyebrow">Explore Our Products</p>
          <h2 id="home-categories-title">Shop Motorcycle Parts by Category</h2>
          <p>
            Find essential replacement parts, maintenance products, and
            accessories for your motorcycle.
          </p>
        </div>

        {error ? (
          <p className="home-category-error" role="status">
            Product categories are temporarily unavailable. Please try again
            shortly.
          </p>
        ) : (
          <div className="home-category-grid">
          {categories.map((category) => {
            const presentation = presentationByName.get(category.name);

            return (
            <article className="home-category-card" key={category.id}>
              <div className="home-category-image">
                <Image
                  src={presentation?.image ?? "/images/hero-section.jpg"}
                  alt={presentation?.alt ?? `${category.name} motorcycle parts`}
                  fill
                  sizes="(max-width: 760px) 100vw, (max-width: 1040px) 50vw, 25vw"
                />
              </div>
              <div className="home-category-content">
                <h3>{category.name}</h3>
                <p>
                  {category.description ??
                    presentation?.description ??
                    `Browse ${category.name.toLowerCase()} for your motorcycle.`}
                </p>
              </div>
              <Link
                className="home-card-link"
                href={`/products?category=${encodeURIComponent(category.name)}`}
                aria-label={`Browse ${category.name}`}
              >
                Browse Parts
                <FontAwesomeIcon
                  icon={homeUtilityIcons.arrow}
                  aria-hidden="true"
                />
              </Link>
            </article>
            );
          })}
          </div>
        )}

        <Link className="home-secondary-cta" href="/products">
          View All Product Categories
          <FontAwesomeIcon
            icon={homeUtilityIcons.arrow}
            aria-hidden="true"
          />
        </Link>
      </div>
    </section>
  );
}
