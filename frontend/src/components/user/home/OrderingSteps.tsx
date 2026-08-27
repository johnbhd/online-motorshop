import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { homeUtilityIcons, orderingSteps } from "../../../data/homeData";

export default function OrderingSteps() {
  return (
    <section
      className="home-section home-ordering"
      id="home-ordering"
      aria-labelledby="home-ordering-title"
    >
      <div className="home-shell">
        <div className="home-section-heading home-section-heading--center">
          <p className="home-eyebrow">Simple Guest Ordering</p>
          <h2 id="home-ordering-title">How Ordering Works</h2>
          <p>
            Order motorcycle parts online without creating an account. Submit
            your request and wait for confirmation from ALD Motorshop staff.
          </p>
        </div>

        <div className="home-steps-grid">
          {orderingSteps.map((step, index) => (
            <div className="home-step-group" key={step.id}>
              <article className="home-step-card">
                <div className="home-step-icon" aria-hidden="true">
                  <FontAwesomeIcon icon={step.icon} />
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
              {index < orderingSteps.length - 1 ? (
                <span className="home-step-arrow" aria-hidden="true">
                  <FontAwesomeIcon icon={homeUtilityIcons.arrow} />
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <Link className="home-primary-cta" href="/#home-products">
          Browse Motorcycle Parts
          <FontAwesomeIcon
            icon={homeUtilityIcons.arrow}
            aria-hidden="true"
          />
        </Link>
      </div>
    </section>
  );
}
