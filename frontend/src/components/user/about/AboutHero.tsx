import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { aboutHighlights, aboutStatistics } from "./aboutData";

export default function AboutHero() {
  return (
    <>
      <div className="about-image-wrap">
        <Image
          src="/images/aldbg.png"
          alt="ALD Motorshop storefront"
          className="about-image"
          fill
          sizes="(max-width: 900px) 100vw, 50vw"
        />

        <div className="about-badges" aria-label="ALD Motorshop highlights">
          {aboutHighlights.map(({ label, icon }) => (
            <span key={label} className="about-badge">
              <span className="about-badge-icon" aria-hidden="true">
                <FontAwesomeIcon icon={icon} />
              </span>
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="about-content">
        <p className="about-eyebrow">Who We Are</p>
        <h1>About ALD Motorshop</h1>

        <div className="about-description">
          <p>
            ALD Motorshop is a motorcycle-parts business offering genuine and
            compatible parts for Honda, Yamaha, and Suzuki motorcycles. The
            business also supports riders through motorcycle maintenance, repair
            services, store pickup, and convenient Lalamove delivery requests.
          </p>
          <p>
            The goal of ALD Motorshop is to make dependable motorcycle parts
            easier to find while giving customers helpful service and convenient
            ways to receive their orders.
          </p>
        </div>

        <div className="about-stats">
          {aboutStatistics.map(({ value, detail, icon }) => (
            <article key={`${value}-${detail}`} className="about-stat-card">
              <span className="about-stat-icon" aria-hidden="true">
                <FontAwesomeIcon icon={icon} />
              </span>
              <p>
                {value}
                <br />
                {detail}
              </p>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
