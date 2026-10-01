"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faCircleCheck,
  faCircleInfo,
  faClock,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/staff/PortalTable";
import ProductModalShell from "@/components/admin/products/ProductModalShell";
import type { Product } from "@/lib/mock/staff";

export type StaffProductDetailsModalProps = {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
};

export default function StaffProductDetailsModal({
  isOpen,
  product,
  onClose,
}: StaffProductDetailsModalProps) {
  if (!isOpen || !product) {
    return null;
  }

  return (
    <ProductModalShell
      isOpen={isOpen}
      eyebrow="Product Details"
      title={product.name}
      description="Read-only product information for Staff."
      titleId="staff-product-details-modal-title"
      descriptionId="staff-product-details-modal-description"
      status={<Badge>{product.availability}</Badge>}
      onClose={onClose}
      footer={
        <div className="admin-order-modal-footer-actions">
          <button
            className="admin-order-modal-button admin-order-modal-button-secondary"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      }
    >
      <section className="admin-order-modal-section">
        <div className="admin-order-modal-section-title">
          <FontAwesomeIcon icon={faBoxOpen} aria-hidden="true" />
          <h3>Product Information</h3>
        </div>
        <dl className="admin-order-modal-detail-grid">
          <div>
            <dt>Product Name</dt>
            <dd>{product.name}</dd>
          </div>
          <div>
            <dt>Product Code</dt>
            <dd>{product.partNumber}</dd>
          </div>
        </dl>
      </section>

      <section className="admin-order-modal-section">
        <div className="admin-order-modal-section-title">
          <FontAwesomeIcon icon={faLayerGroup} aria-hidden="true" />
          <h3>Catalog Classification</h3>
        </div>
        <dl className="admin-order-modal-detail-grid">
          <div>
            <dt>Brand</dt>
            <dd>{product.brand}</dd>
          </div>
          <div>
            <dt>Category</dt>
            <dd>{product.category}</dd>
          </div>
        </dl>
      </section>

      <section className="admin-order-modal-section">
        <div className="admin-order-modal-section-title">
          <FontAwesomeIcon icon={faCircleCheck} aria-hidden="true" />
          <h3>Pricing &amp; Availability</h3>
        </div>
        <dl className="admin-order-modal-detail-grid">
          <div>
            <dt>Price</dt>
            <dd className="admin-order-modal-total">{product.price}</dd>
          </div>
          <div>
            <dt>Availability</dt>
            <dd>
              <Badge>{product.availability}</Badge>
            </dd>
          </div>
        </dl>
      </section>

      <section className="admin-order-modal-section">
        <div className="admin-order-modal-section-title">
          <FontAwesomeIcon icon={faClock} aria-hidden="true" />
          <h3>Record Information</h3>
        </div>
        <dl className="admin-order-modal-detail-grid">
          <div>
            <dt>Last Updated</dt>
            <dd>{product.updated}</dd>
          </div>
        </dl>
      </section>

      <div className="admin-order-review-notice">
        <FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" />
        <p>
          <strong>Staff product view</strong>
          <span>
            Product images and descriptions are not available in the current
            Staff product record.
          </span>
        </p>
      </div>
    </ProductModalShell>
  );
}
