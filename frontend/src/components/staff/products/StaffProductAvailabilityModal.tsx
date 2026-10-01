"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faCircleInfo,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/staff/PortalTable";
import ProductModalShell from "@/components/admin/products/ProductModalShell";
import type { Product } from "@/lib/mock/staff";

export const productAvailabilityOptions = [
  "Available",
  "Low Stock",
  "Subject to Confirmation",
  "Out of Stock",
] as const;

export type ProductAvailability =
  (typeof productAvailabilityOptions)[number];

export type StaffProductAvailabilityModalProps = {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onUpdateAvailability: (
    partNumber: string,
    availability: ProductAvailability,
  ) => void;
};

function isProductAvailability(
  value: string,
): value is ProductAvailability {
  return productAvailabilityOptions.includes(value as ProductAvailability);
}

function getInitialAvailability(product: Product): ProductAvailability {
  return isProductAvailability(product.availability)
    ? product.availability
    : productAvailabilityOptions[0];
}

function getConfirmationDescription(
  product: Product,
  nextAvailability: ProductAvailability,
) {
  return `${product.name} will change from ${product.availability} to ${nextAvailability}. This updates the current Staff page session only.`;
}

export default function StaffProductAvailabilityModal({
  isOpen,
  product,
  onClose,
  onUpdateAvailability,
}: StaffProductAvailabilityModalProps) {
  const confirmationButtonRef = useRef<HTMLButtonElement>(null);
  const isConfirmingRef = useRef(false);
  const [nextAvailability, setNextAvailability] =
    useState<ProductAvailability>(() =>
      product ? getInitialAvailability(product) : productAvailabilityOptions[0],
    );
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!isConfirming) {
      return;
    }

    const focusFrame = window.requestAnimationFrame(() => {
      confirmationButtonRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(focusFrame);
  }, [isConfirming]);

  const handleClose = useCallback(() => {
    if (isConfirmingRef.current) {
      isConfirmingRef.current = false;
      setIsConfirming(false);
      return;
    }

    onClose();
  }, [onClose]);

  if (!isOpen || !product) {
    return null;
  }

  const hasChanges = nextAvailability !== product.availability;

  const handleConfirmUpdate = () => {
    isConfirmingRef.current = false;
    onUpdateAvailability(product.partNumber, nextAvailability);
    setIsConfirming(false);
  };

  return (
    <>
      <ProductModalShell
        isOpen={isOpen}
        eyebrow="Update Product Availability"
        title={product.name}
        description="Change only the Staff availability value for this product."
        titleId="staff-product-availability-modal-title"
        descriptionId="staff-product-availability-modal-description"
        status={<Badge>{product.availability}</Badge>}
        onClose={handleClose}
        footer={
          <div className="admin-order-modal-footer-actions">
            <button
              className="admin-order-modal-button admin-order-modal-button-secondary"
              type="button"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              className="admin-order-modal-button admin-order-modal-button-primary disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              disabled={!hasChanges}
              onClick={() => {
                isConfirmingRef.current = true;
                setIsConfirming(true);
              }}
            >
              <FontAwesomeIcon icon={faArrowsRotate} aria-hidden="true" />
              Update Availability
            </button>
          </div>
        }
      >
        <section className="admin-order-modal-section">
          <div className="admin-order-modal-section-title">
            <FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" />
            <h3>Product</h3>
          </div>
          <dl className="admin-order-modal-detail-grid">
            <div>
              <dt>Product Code</dt>
              <dd>{product.partNumber}</dd>
            </div>
            <div>
              <dt>Brand</dt>
              <dd>{product.brand}</dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd className="admin-order-modal-total">{product.price}</dd>
            </div>
          </dl>
        </section>

        <section className="admin-order-modal-section">
          <div className="admin-order-modal-section-title">
            <FontAwesomeIcon icon={faArrowsRotate} aria-hidden="true" />
            <h3>Availability Status</h3>
          </div>
          <div className="admin-order-modal-control-grid">
            <div className="admin-order-modal-field">
              <span>Current Availability</span>
              <Badge>{product.availability}</Badge>
            </div>
            <label
              className="admin-order-modal-field"
              htmlFor="staff-product-new-availability"
            >
              <span>New Availability</span>
              <select
                id="staff-product-new-availability"
                value={nextAvailability}
                onChange={(event) =>
                  setNextAvailability(
                    event.target.value as ProductAvailability,
                  )
                }
              >
                {productAvailabilityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <div className="admin-order-review-notice">
          <FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" />
          <p>
            <strong>Availability only</strong>
            <span>
              Product name, code, brand, category, price, and historical order
              snapshots remain unchanged.
            </span>
          </p>
        </div>
      </ProductModalShell>

      {isConfirming ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/40 p-4">
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="staff-product-availability-confirmation-title"
            aria-describedby="staff-product-availability-confirmation-description"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-600">
                <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
              </span>
              <div>
                <h3
                  id="staff-product-availability-confirmation-title"
                  className="font-semibold text-[#0B1930]"
                >
                  Update product availability?
                </h3>
                <p
                  id="staff-product-availability-confirmation-description"
                  className="mt-2 text-sm leading-6 text-slate-600"
                >
                  {getConfirmationDescription(product, nextAvailability)}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="admin-order-modal-button admin-order-modal-button-secondary"
                type="button"
                onClick={() => {
                  isConfirmingRef.current = false;
                  setIsConfirming(false);
                }}
              >
                Cancel
              </button>
              <button
                ref={confirmationButtonRef}
                className="admin-order-modal-button admin-order-modal-button-primary"
                type="button"
                onClick={handleConfirmUpdate}
              >
                Update Availability
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
