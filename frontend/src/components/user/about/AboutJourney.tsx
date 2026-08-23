import { aboutJourney } from "./aboutData";

export default function AboutJourney() {
  return (
    <section className="journey-section">
      <div className="wrap">
        <div className="journey-head">
          <div className="eyebrow">Our Journey</div>
          <h2 className="section-title">
            From One Shop to Multiple ALD Branches
          </h2>
          <p className="section-sub">
            ALD Motorshop began with the goal of helping motorcycle owners find
            reliable parts and practical service more easily.
          </p>
        </div>

        <div className="timeline">
          {aboutJourney.map(({ title, subtitle, description }) => (
            <article className="t-item" key={title}>
              <div className="t-dot" />
              <h4>{title}</h4>
              <h4 className="line2">{subtitle}</h4>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
