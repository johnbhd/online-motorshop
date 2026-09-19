import type { ProductDisplayItem } from "../products/productsData";

type ProductInformationProps = {
  product: ProductDisplayItem;
};

export default function ProductInformation({
  product,
}: ProductInformationProps) {
  const statusLabel = product.status === "active" ? "Listed" : "Unavailable";

  return (
    <section
      className="product-details-information"
      aria-labelledby="product-details-information-title"
    >
      <div className="product-details-section-heading">
        <p className="product-details-section-eyebrow">Product details</p>
        <h2 id="product-details-information-title">Product Information</h2>
      </div>

      <div className="product-details-information-grid">
        <div className="product-details-description-block">
          <h3>Description</h3>
          <p>{product.description}</p>
        </div>

        <dl className="product-details-facts">
          <div>
            <dt>Product Code</dt>
            <dd>{product.partNumber}</dd>
          </div>
          <div>
            <dt>Brand</dt>
            <dd>{product.brand}</dd>
          </div>
          <div>
            <dt>Category</dt>
            <dd>{product.category}</dd>
          </div>
          <div>
            <dt>Listing Status</dt>
            <dd>{statusLabel}</dd>
          </div>
        </dl>
      </div>

      <p className="product-details-information-note">
        Displayed prices are temporary Philippine peso demo estimates. Confirm model
        compatibility, stock quantity, specifications, and final pricing with ALD
        staff before ordering.
      </p>
    </section>
  );
}
