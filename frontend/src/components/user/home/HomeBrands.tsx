import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { homeBrands, homeUtilityIcons } from "../../../data/homeData";

export default function HomeBrands() {
  return (
    <section
      className="home-section home-brands"
      id="home-brands"
      aria-labelledby="home-brands-title"
    >
      <div className="home-shell">
        <div className="home-section-heading home-section-heading--center">
          <p className="home-eyebrow home-eyebrow--light">
            Shop by Motorcycle Brand
          </p>
          <h2 id="home-brands-title">Find Parts for Your Motorcycle</h2>
          <p>
            Browse compatible motorcycle parts for Honda, Yamaha, and Suzuki
            models.
          </p>
        </div>

        <div className="home-brand-grid">
          {homeBrands.map((brand) => (
            <article className="home-brand-card" key={brand.id}>
              <div className="home-brand-image">
                <Image
                  src={brand.image}
                  alt={brand.alt}
                  fill
                  sizes="(max-width: 760px) 100vw, 33vw"
                />
              </div>
              <div className="home-brand-content">
                <h3>{brand.name}</h3>
                <p>{brand.description}</p>
                <Link className="home-card-link" href={brand.href}>
                  Browse {brand.name} Parts
                  <FontAwesomeIcon
                    icon={homeUtilityIcons.arrow}
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <Link className="home-secondary-cta" href="/#home-products">
          View All Compatible Parts
          <FontAwesomeIcon
            icon={homeUtilityIcons.arrow}
            aria-hidden="true"
          />
        </Link>
      </div>
    </section>
  );
}
