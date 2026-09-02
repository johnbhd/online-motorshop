import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { contactSocials } from "./contactData";

export default function ContactSocials() {
  return (
    <section
      className="contact-socials"
      aria-labelledby="contact-socials-title"
    >
      <div className="contact-shell contact-socials-inner">
        <div>
          <p className="contact-eyebrow">Social accounts</p>
          <h2 id="contact-socials-title">Find ALD Motorshop online</h2>
          <p>
            Visit the verified ALD Motorshop account pages on their respective
            platforms.
          </p>
        </div>

        <div className="contact-social-list">
          {contactSocials.map((social) => (
            <a
              className="contact-social-card"
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              key={social.id}
            >
              <span className="contact-social-icon" aria-hidden="true">
                <FontAwesomeIcon icon={social.icon} />
              </span>
              <span>
                <strong>{social.label}</strong>
                <small>{social.account}</small>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
