import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboardList } from "@fortawesome/free-solid-svg-icons";
import {
  homeHighlights,
  homeUtilityIcons,
} from "../../../data/homeData";

export default function HomeHero() {
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero-media" aria-hidden="true">
        <Image
          src="https://res.cloudinary.com/ykkjo51n/image/upload/v1787814776/manila.png"
          alt=""
          fill
          priority
          sizes="100vw"
        />
      </div>
      <div className="home-hero-overlay" aria-hidden="true" />

      <div className="home-shell home-hero-shell">
        <div className="home-hero-copy">
          <p className="home-eyebrow home-hero-eyebrow">
            Genuine Motorcycle Parts
          </p>
          <h1 id="home-hero-title">
            Ride ready
            <span>with the right parts.</span>
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
                icon={faClipboardList}
                aria-hidden="true"
              />
              View Ordering Steps
            </Link>
          </div>

          <p className="home-hero-reassurance">
            <FontAwesomeIcon
              icon={homeHighlights[0].icon}
              aria-hidden="true"
            />
            <span>No account required. Guest ordering is available.</span>
          </p>
        </div>

      </div>
    </section>
  );
}
