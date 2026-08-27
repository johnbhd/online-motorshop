import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fulfillmentOptions, homeUtilityIcons } from "../../../data/homeData";

export default function FulfillmentSection() {
  return (
    <section
      className="home-section home-fulfillment"
      id="home-fulfillment"
      aria-labelledby="home-fulfillment-title"
    >
      <div className="home-shell">
        <div className="home-section-heading home-section-heading--center">
          <p className="home-eyebrow">Choose Your Fulfillment Option</p>
          <h2 id="home-fulfillment-title">Pickup or Delivery, You Decide</h2>
          <p>
            Choose the most convenient way to receive your motorcycle parts
            after your order has been confirmed.
          </p>
        </div>

        <div className="home-fulfillment-grid">
          {fulfillmentOptions.map((option) => (
            <article
              className={`home-fulfillment-card home-fulfillment-card--${option.tone}`}
              key={option.id}
            >
              <div className="home-fulfillment-image">
                <Image
                  src={option.image}
                  alt={option.alt}
                  fill
                  sizes="(max-width: 900px) 100vw, 40vw"
                />
              </div>
              <div className="home-fulfillment-content">
                <p className="home-fulfillment-label">
                  <FontAwesomeIcon icon={option.icon} aria-hidden="true" />
                  {option.label}
                </p>
                <h3>{option.title}</h3>
                <p className="home-fulfillment-description">
                  {option.description}
                </p>
                <ul className="home-fulfillment-list">
                  {option.items.map((item) => (
                    <li key={item}>
                      <FontAwesomeIcon
                        icon={homeUtilityIcons.check}
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link className="home-fulfillment-action" href={option.href}>
                  {option.actionLabel}
                  <FontAwesomeIcon
                    icon={homeUtilityIcons.arrow}
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}
