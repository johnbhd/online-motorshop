"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import ProductInquiryCard from "./ProductInquiryCard";
import type { ProductInquiryDraft } from "./chatbotTypes";

export type ProductInquiryPreviewProps = {
  product: ProductInquiryDraft;
  onCancel: () => void;
};

export default function ProductInquiryPreview({
  product,
  onCancel,
}: ProductInquiryPreviewProps) {
  return (
    <section
      className="ald-chatbot__product-inquiry-preview"
      aria-label="Pending product inquiry"
    >
      <div className="ald-chatbot__inquiry-preview-header">
        <div>
          <p className="ald-chatbot__inquiry-preview-eyebrow">Product inquiry</p>
          <h3>Ask ALD Staff about this product</h3>
        </div>
        <button
          className="ald-chatbot__inquiry-close"
          type="button"
          aria-label="Remove product inquiry"
          onClick={onCancel}
        >
          <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
        </button>
      </div>
      <ProductInquiryCard
        product={{
          name: product.name,
          partNumber: product.partNumber,
          price: product.price,
          image: product.image,
          brand: product.brand,
        }}
      />
    </section>
  );
}
