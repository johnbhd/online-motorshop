import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot, faPhone } from "@fortawesome/free-solid-svg-icons";
import { contactBranches } from "./contactData";

export default function ContactBranches() {
  return (
    <section
      className="contact-section contact-branches"
      id="contact-branches"
      aria-labelledby="contact-branches-title"
    >
      <div className="contact-shell">
        <div className="contact-section-heading">
          <p className="contact-eyebrow">Visit ALD Motorshop</p>
          <h2 id="contact-branches-title">Our verified branches</h2>
          <p>
            Choose the branch that is most convenient for your parts inquiry,
            maintenance request, or confirmed store pickup.
          </p>
        </div>

        <div className="contact-branch-grid">
          {contactBranches.map((branch) => (
            <article className="contact-branch-card" key={branch.id}>
              <div className="contact-branch-card-heading">
                <span className="contact-branch-icon" aria-hidden="true">
                  <FontAwesomeIcon icon={faLocationDot} />
                </span>
                <h3>{branch.name}</h3>
              </div>
              <p className="contact-branch-address">{branch.address}</p>
              <ul className="contact-branch-services">
                {branch.services.map((service) => (
                  <li key={service}>{service}</li>
                ))}
              </ul>
              <div className="contact-branch-card-footer">
                <span>Contact branch for current hours</span>
                <a
                  href="tel:+639958691174"
                  aria-label={`Call ALD Motorshop about ${branch.name}`}
                >
                  <FontAwesomeIcon icon={faPhone} aria-hidden="true" />
                  Call
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
