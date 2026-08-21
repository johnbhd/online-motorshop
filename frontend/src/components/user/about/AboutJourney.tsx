"use client"


export default function AboutJourney() {
  return (
    <section className="journey-section">
        <div className="wrap">
            <div className="journey-head">
            <div className="eyebrow">Our Journey</div>
            <h2 className="section-title">From One Shop to Multiple ALD Branches</h2>
            <p className="section-sub">ALD Motorshop began with the goal of helping motorcycle owners find reliable parts and practical service more easily.</p>
            </div>

            <div className="timeline">
            <div className="t-item">
                <div className="t-dot"></div>
                <h4>The Beginning</h4>
                <h4 className="line2">Starting the Business</h4>
                <p>ALD Motorshop began as a local motorcycle-parts shop focused on serving riders with dependable products and helpful assistance.</p>
            </div>
            <div className="t-item">
                <div className="t-dot"></div>
                <h4>Growing Trust</h4>
                <h4 className="line2">Building Customer Relationships</h4>
                <p>The shop continued serving customers looking for parts, motorcycle maintenance, and repair assistance.</p>
            </div>
            <div className="t-item">
                <div className="t-dot"></div>
                <h4>Business Expansion</h4>
                <h4 className="line2">Opening More Branches</h4>
                <p>ALD Motorshop expanded from one shop into multiple branches to make products and services more accessible.</p>
            </div>
            <div className="t-item">
                <div className="t-dot"></div>
                <h4>Today</h4>
                <h4 className="line2">Four Years of Service</h4>
                <p>After four years of operation, ALD continues improving how customers browse, request, pick up, and receive motorcycle parts.</p>
            </div>
            </div>
        </div>
    </section>

  );
}
