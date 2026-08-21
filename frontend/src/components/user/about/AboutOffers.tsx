import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { aboutOffers } from "./aboutData";
export default function AboutOffers() {
  return (
    <section className="offer-section">
        <div className="wrap">
            <div className="offer-head">
            <div className="eyebrow">Products and Services</div>
            <h2 className="section-title">What ALD Motorshop Offers</h2>
            <p className="section-sub">Products and services designed to help riders maintain and improve their motorcycles.</p>
            </div>

            <div className="offer-table">
            {aboutOffers.map(({ title, description, icon }) => (
              <article className="offer-cell" key={title}>
                <div className="offer-icon" aria-hidden="true"><FontAwesomeIcon icon={icon} /></div>
                <div><h4>{title}</h4><p>{description}</p></div>
              </article>
            ))}
            </div>
        </div>
        </section>

  );
}
