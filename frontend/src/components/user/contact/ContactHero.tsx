import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone } from "@fortawesome/free-solid-svg-icons";
import {
  contactBranches,
  contactHeroIcon,
} from "./contactData";

const featuredBranch = contactBranches[0];

export default function ContactHero() {
  return (
    <section className="contact-hero" aria-labelledby="contact-page-title">
      <div className="contact-shell contact-hero-grid">
        <div className="contact-hero-content">
          <p className="contact-eyebrow">Get in touch</p>
          <h1 id="contact-page-title">Contact ALD Motorshop</h1>
          <p className="contact-hero-description">
            Need help finding a motorcycle part, confirming a pickup request,
            or asking about delivery? Contact ALD Motorshop and our team can
            help you with the next step.
          </p>
          <div className="contact-hero-actions">
            <a
              className="contact-button contact-button-primary"
              href="tel:+639958691174"
            >
              <FontAwesomeIcon icon={faPhone} aria-hidden="true" />
              Call ALD Motorshop
            </a>
            <Link
              className="contact-button contact-button-secondary"
              href="#contact-form"
            >
              <FontAwesomeIcon icon={contactHeroIcon} aria-hidden="true" />
              Send an inquiry
            </Link>
          </div>
        </div>

        <div className="contact-hero-image">
          <Image
            src={featuredBranch.image}
            alt={`ALD Motorshop ${featuredBranch.name}`}
            fill
            priority
            sizes="(max-width: 760px) 100vw, 38vw"
          />
          <div className="contact-hero-image-caption">
            <span>Featured branch</span>
            <strong>{featuredBranch.name}</strong>
            <small>{featuredBranch.address}</small>
          </div>
        </div>
      </div>
    </section>
  );
}
