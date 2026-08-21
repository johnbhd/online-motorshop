"use client"

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
            <div className="offer-cell">
                <div className="offer-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg></div>
                <div>
                <h4>Genuine Motorcycle Parts</h4>
                <p>Reliable and compatible motorcycle parts selected for different motorcycle models.</p>
                </div>
            </div>
            <div className="offer-cell">
                <div className="offer-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l3-8h4l4 8"/><path d="M9 9h5l2 4"/></svg></div>
                <div>
                <h4>Honda, Yamaha and Suzuki Parts</h4>
                <p>Parts and maintenance products for three widely used motorcycle brands.</p>
                </div>
            </div>
            <div className="offer-cell">
                <div className="offer-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2c-3 3-3 6.5 0 9.5 3-3 3-6.5 0-9.5z"/><path d="M6.5 13c1.5-1.5 3.6-2 5.5-2s4 .5 5.5 2c1 1 1.5 3 .5 5.5-1 .5-2 1-3 1-2 0-3-1.5-3-3.5 0 2-1 3.5-3 3.5-1 0-2-.5-3-1-1-2.5-.5-4.5.5-5.5z"/></svg></div>
                <div>
                <h4>Motorcycle Accessories</h4>
                <p>Practical accessories for motorcycle safety, comfort, maintenance, and appearance.</p>
                </div>
            </div>
            <div className="offer-cell">
                <div className="offer-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14.7 6.3a5 5 0 0 1-6.4 6.4l-6 6 2 2 6-6a5 5 0 0 1 6.4-6.4l-2.7 2.7-2-2 2.7-2.7z"/></svg></div>
                <div>
                <h4>Maintenance and Repair Services</h4>
                <p>Motorcycle maintenance and repair assistance provided by experienced ALD personnel.</p>
                </div>
            </div>
            <div className="offer-cell">
                <div className="offer-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l1-5h16l1 5"/><path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9"/><path d="M9 21V13h6v8"/></svg></div>
                <div>
                <h4>Store Pickup</h4>
                <p>Customers can request products online and collect confirmed orders from their selected ALD branch.</p>
                </div>
            </div>
            <div className="offer-cell">
                <div className="offer-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="1" y="7" width="15" height="10" rx="1"/><path d="M16 10h4l3 3v4h-7z"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></svg></div>
                <div>
                <h4>Lalamove Delivery Requests</h4>
                <p>Customers can request delivery after the order, payment, address, and delivery fee have been confirmed.</p>
                </div>
            </div>
            </div>
        </div>
        </section>

  );
}
