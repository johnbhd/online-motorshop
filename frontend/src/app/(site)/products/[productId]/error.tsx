"use client";

export default function ProductDetailsError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <main className="product-details-page">
      <div className="product-details-shell">
        <section className="products-error-state" role="alert">
          <h1>Product details are temporarily unavailable</h1>
          <p>Unable to load this product right now. Please try again.</p>
          <button className="products-apply-button" type="button" onClick={reset}>
            Retry
          </button>
        </section>
      </div>
    </main>
  );
}
