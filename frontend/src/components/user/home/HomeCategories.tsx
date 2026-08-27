import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { homeCategories, homeUtilityIcons } from "../../../data/homeData";

export default function HomeCategories() {
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

        <div className="home-category-grid">
          {homeCategories.map((category) => (
            <article className="home-category-card" key={category.id}>
              <div className="home-category-image">
                <Image
                  src={category.image}
                  alt={category.alt}
                  fill
                  sizes="(max-width: 760px) 100vw, (max-width: 1040px) 50vw, 25vw"
                />
              </div>
              <div className="home-category-content">
                <h3>{category.name}</h3>
                <p>{category.description}</p>
              </div>
              <Link className="home-card-link" href={category.href}>
                Browse Parts
                <FontAwesomeIcon
                  icon={homeUtilityIcons.arrow}
                  aria-hidden="true"
                />
              </Link>
            </article>
          ))}
        </div>

        <Link className="home-secondary-cta" href="/#home-products">
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
