import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuilding, faCheck, faMotorcycle, faStore, faTruck } from "@fortawesome/free-solid-svg-icons";

const highlights = [
  "Genuine Motorcycle Parts",
  "Trusted Local Service",
  "Multiple Branches",
];

const statistics = [
  { icon: "▣", lines: ["4 Years", "In Business"] },
  { icon: "⌂", lines: ["3 Verified", "Branches"] },
  { icon: "◉", lines: ["Honda, Yamaha", "and Suzuki Parts"] },
  { icon: "▰", lines: ["Pickup and", "Delivery Available"] },
];

export default function AboutPage() {
  return (
    <section className="about-section">
      <div className="about-image-wrap">
        <Image
          src="https://scontent.fcrk1-2.fna.fbcdn.net/v/t39.30808-6/634750503_1214210287534275_6205258320724220230_n.jpg?stp=dst-jpg_tt6&cstp=mx1537x2048&ctp=p526x296&_nc_cat=108&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeFmD84e8RxZvWgAcJKyZW4eZ1_6ws2wcTxnX_rCzbBxPGPTRfdYG7ks6vL2Drx498HfT2Q-Kk9efxtEzmJ8WMEN&_nc_ohc=lCMUxqr1SQEQ7kNvwF9yVLn&_nc_oc=Adpmx06CiU-Cd2meGu7R2gZhGx3HusObhZh5wU8n4cGz0uQjif1rfwzTPM60xQNKBNg&_nc_zt=23&_nc_ht=scontent.fcrk1-2.fna&_nc_gid=rK1-BxIdC_4xzfwdG-zBqg&_nc_ss=7a2a8&oh=00_AQEjYJ-XyUuahYTvkdUF9b3pfM3I4XzUWlZ3APOrgDcvSw&oe=6A83A0C1"
          alt="ALD Motorshop storefront"
          className="about-image"
          fill
          sizes="(max-width: 900px) 100vw, 50vw"
        />

        <div className="about-badges" aria-label="ALD Motorshop highlights">
          {highlights.map((highlight) => (
            <span key={highlight} className="about-badge">
              <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
              {highlight}
            </span>
          ))}
        </div>
      </div>

      <div className="about-content">
        <p className="about-eyebrow">Who We Are</p>
        <h1>About ALD Motorshop</h1>

        <div className="about-description">
          <p>ALD Motorshop is a motorcycle-parts business offering genuine and compatible parts for Honda, Yamaha, and Suzuki motorcycles. The business also supports riders through motorcycle maintenance, repair services, store pickup, and convenient Lalamove delivery requests.</p>
          <p>The goal of ALD Motorshop is to make dependable motorcycle parts easier to find while giving customers helpful service and convenient ways to receive their orders.</p>
        </div>

        <div className="about-stats">
          {statistics.map((statistic) => (
            <article key={statistic.lines.join(" ")} className="about-stat-card">
              <span className="about-stat-icon" aria-hidden="true"><FontAwesomeIcon icon={statistic.lines[0] === "4 Years" ? faBuilding : statistic.lines[0] === "3 Verified" ? faStore : statistic.lines[0] === "Honda, Yamaha" ? faMotorcycle : faTruck} /></span>
              <p>{statistic.lines[0]}<br />{statistic.lines[1]}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}