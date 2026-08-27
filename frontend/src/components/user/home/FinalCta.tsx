import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { homeInfoCards, homeUtilityIcons } from "../../../data/homeData";

export default function FinalCta() {
  return (
    <section className="home-final-cta" aria-labelledby="home-final-cta-title">
      <div className="home-shell home-final-cta-shell">
        <div className="home-final-cta-copy">
          <p className="home-eyebrow">Need Help Finding a Part?</p>
          <h2 id="home-final-cta-title">
            Find the right motorcycle part with ALD.
          </h2>
          <p>
            Browse our motorcycle-parts catalog or contact ALD Motorshop for
            help with product availability, compatibility, pickup, and
            delivery.
          </p>

          <div className="home-final-cta-actions">
            <Link
              className="home-button home-button--primary"
              href="/#home-products"
            >
              Browse Motorcycle Parts
              <FontAwesomeIcon
                icon={homeUtilityIcons.arrow}
                aria-hidden="true"
              />
            </Link>
            <a
              className="home-button home-button--dark-outline"
              href="tel:+639958691174"
            >
              <FontAwesomeIcon
                icon={homeUtilityIcons.phone}
                aria-hidden="true"
              />
              Contact ALD Motorshop
            </a>
          </div>

          <p className="home-final-cta-note">
            For faster assistance, prepare your motorcycle brand, model, year,
            and the part you are looking for.
          </p>
        </div>

        <div className="home-info-card-grid">
          {homeInfoCards.map((card) => (
            <article className="home-info-card" key={card.id}>
              <span className="home-info-card-icon" aria-hidden="true">
                <FontAwesomeIcon icon={card.icon} />
              </span>
              <div>
                <h3>{card.title}</h3>
                <p>{card.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
