import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  contactArrowIcon,
  contactInfoItems,
} from "./contactData";

export default function ContactInfo() {
  return (
    <section
      className="contact-section contact-info"
      aria-labelledby="contact-info-title"
    >
      <div className="contact-shell">
        <div className="contact-section-heading">
          <p className="contact-eyebrow">Contact options</p>
          <h2 id="contact-info-title">Choose the best way to reach us</h2>
          <p>
            Choose the most convenient way to contact the ALD Motorshop team.
          </p>
        </div>

        <div className="contact-info-grid">
          {contactInfoItems.map((item) => (
            <article className="contact-info-card" key={item.id}>
              <span className="contact-info-icon" aria-hidden="true">
                <FontAwesomeIcon icon={item.icon} />
              </span>
              <div className="contact-info-copy">
                <h3 className="contact-card-label">{item.label}</h3>
                <p className="contact-info-detail">{item.value}</p>
                {item.ctaHref ? (
                  <a
                    className="contact-info-cta"
                    href={item.ctaHref}
                    target={item.ctaHref.startsWith("http") ? "_blank" : undefined}
                    rel={item.ctaHref.startsWith("http") ? "noopener noreferrer" : undefined}
                  >
                    {item.ctaLabel}
                    <FontAwesomeIcon icon={contactArrowIcon} aria-hidden="true" />
                  </a>
                ) : (
                  <span className="contact-info-cta contact-info-cta-static">
                    {item.ctaLabel}
                    <FontAwesomeIcon icon={contactArrowIcon} aria-hidden="true" />
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
