import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  homeBadges,
  homeHighlights,
  homeUtilityIcons,
} from "../../../data/homeData";

export default function HomeHero() {
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero-media" aria-hidden="true">
        <Image
          src="/images/aldbg.png"
          alt=""
          fill
          priority
          sizes="100vw"
        />
      </div>
      <div className="home-hero-overlay" aria-hidden="true" />

      <div className="home-shell home-hero-shell">
        <div className="home-hero-copy">
          <p className="home-eyebrow">Genuine Motorcycle Parts</p>
          <h1 id="home-hero-title">
            Ride ready with the
            <span>right parts.</span>
          </h1>
          <p className="home-hero-description">
            Browse genuine and compatible Honda, Yamaha, and Suzuki motorcycle
            parts. Submit your order online and choose store pickup or
            Lalamove delivery.
          </p>

          <div className="home-hero-actions">
            <Link
              className="home-button home-button--primary"
              href="/#home-products"
            >
              <FontAwesomeIcon
                icon={homeUtilityIcons.cart}
                aria-hidden="true"
              />
              Shop Motorcycle Parts
            </Link>
            <Link
              className="home-button home-button--outline"
              href="/#home-ordering"
            >
              <FontAwesomeIcon
                icon={homeHighlights[2].icon}
                aria-hidden="true"
              />
              View Ordering Steps
            </Link>
          </div>

          <div
            className="home-highlight-list"
            aria-label="ALD Motorshop services"
          >
            {homeHighlights.map((highlight) => (
              <div className="home-highlight" key={highlight.id}>
                <span className="home-highlight-icon" aria-hidden="true">
                  <FontAwesomeIcon icon={highlight.icon} />
                </span>
                <span>{highlight.label}</span>
              </div>
            ))}
          </div>

          <p className="home-hero-note">
            <FontAwesomeIcon
              icon={homeHighlights[0].icon}
              aria-hidden="true"
            />
            No account required. Guest ordering is available.
          </p>
        </div>

        <div className="home-hero-badges">
          {homeBadges.map((badge) => (
            <article className="home-hero-badge" key={badge.id}>
              <span className="home-hero-badge-icon" aria-hidden="true">
                <FontAwesomeIcon icon={badge.icon} />
              </span>
              <div>
                <strong>{badge.title}</strong>
                {badge.detail ? <span>{badge.detail}</span> : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
