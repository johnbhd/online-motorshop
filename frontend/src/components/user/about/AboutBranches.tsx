export { default } from "./AboutBranchesNext";
/* Legacy implementation retained for reference.
"use client"

export default function AboutBranches() {
  
  return (
    <section className="branches-section">
      <div className="wrap">
        <div className="branches-head">
          <div className="eyebrow">Visit ALD Motorshop</div>
          <h2 className="section-title">Our Verified Branches</h2>
          <p className="section-sub">Visit one of the currently verified ALD Motorshop branches for motorcycle parts, service, and order pickup. Branch hours, contact details, and service availability should be confirmed directly with ALD Motorshop.</p>
        </div>

        <div className="branch-grid">

          <div className="branch-card">
            <div className="branch-photo"><img src="./branches/manila.png" alt="Manila Branch"/></div>
            <div className="branch-body">
              <h4>ALD Motorshop — Manila Branch</h4>
              <div className="b-line">
                <div className="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
                <span>3333 New Panaderos, Santa Ana, Manila, 1016 Metro Manila</span>
              </div>
              <div className="b-line">
                <div className="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg></div>
                <span>Contact branch for current hours</span>
              </div>
              <div className="b-line">
                <div className="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></div>
                <span>Contact ALD Motorshop</span>
              </div>
              <div className="tag-row">
                <span className="tag">Motorcycle Parts</span>
                <span className="tag">Maintenance and Repair</span>
                <span className="tag">Store Pickup</span>
              </div>
              <div className="branch-actions">
                <a className="btn" href="#">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  View on Map
                </a>
                <a className="btn primary" href="#">Select as Pickup Branch</a>
              </div>
            </div>
          </div>

          <div className="branch-card">
            <div className="branch-photo"><img src="./branches/makati.png" alt="Makati Branch"/></div>
            <div className="branch-body">
              <h4>ALD Motorshop — Makati Branch</h4>
              <div className="b-line">
                <div className="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
                <span>3678 Bautista Street, Makati City</span>
              </div>
              <div className="b-line">
                <div className="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg></div>
                <span>Contact branch for current hours</span>
              </div>
              <div className="b-line">
                <div className="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></div>
                <span>Contact ALD Motorshop</span>
              </div>
              <div className="tag-row">
                <span className="tag">Motorcycle Parts</span>
                <span className="tag">Maintenance and Repair</span>
                <span className="tag">Store Pickup</span>
              </div>
              <div className="branch-actions">
                <a className="btn" href="#">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  View on Map
                </a>
                <a className="btn primary" href="#">Select as Pickup Branch</a>
              </div>
            </div>
          </div>

          <div className="branch-card">
            <div className="branch-photo"><img src="./branches/imus.png" alt="Imus Branch"/></div>
            <div className="branch-body">
              <h4>ALD Motorshop — Imus Branch</h4>
              <div className="b-line">
                <div className="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
                <span>LVS Building, General Aguinaldo Highway, Imus, 4103 Cavite</span>
              </div>
              <div className="b-line">
                <div className="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg></div>
                <span>Contact branch for current hours</span>
              </div>
              <div className="b-line">
                <div className="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></div>
                <span>Contact ALD Motorshop</span>
              </div>
              <div className="tag-row">
                <span className="tag">Motorcycle Parts</span>
                <span className="tag">Maintenance and Repair</span>
                <span className="tag">Store Pickup</span>
              </div>
              <div className="branch-actions">
                <a className="btn" href="#">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  View on Map
                </a>
                <a className="btn primary" href="#">Select as Pickup Branch</a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

  );
}
*/
