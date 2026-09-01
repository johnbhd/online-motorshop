import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone } from "@fortawesome/free-solid-svg-icons";
import { contactHeroIcon } from "./contactData";

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

        <div className="contact-hero-panel" aria-label="Contact support topics">
          <span className="contact-hero-panel-icon" aria-hidden="true">
            <FontAwesomeIcon icon={contactHeroIcon} />
          </span>
          <p className="contact-hero-panel-label">We can help with</p>
          <ul>
            <li>Parts availability questions</li>
            <li>Store pickup requests</li>
            <li>Lalamove delivery requests</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
