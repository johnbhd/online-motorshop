"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faCircleCheck,
  faCircleInfo,
  faDatabase,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { Badge } from "@/components/staff/PortalTable";
import ProductModalShell from "@/components/admin/products/ProductModalShell";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getStaffProduct,
  getStaffProductsErrorMessage,
} from "./staffProductsApi";
import type { StaffProduct } from "./staffProductsTypes";

type Props = {
  isOpen: boolean;
  partNumber: string;
  onClose: () => void;
};

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not available"
    : dateFormatter.format(date);
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function RealStaffProductDetailsModal({
  isOpen,
  partNumber,
  onClose,
}: Props) {
  const { user } = useAuth();
  const [product, setProduct] = useState<StaffProduct | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    if (!isOpen || !partNumber || user?.role !== "staff") {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      const token = getAuthToken();

      setProduct(null);
      setError(null);
      setIsLoading(true);

      if (!token) {
        setIsLoading(false);
        setError("Your Staff session has expired. Please sign in again.");
        return;
      }

      try {
        const response = await getStaffProduct(
          token,
          partNumber,
          controller.signal,
        );

        setProduct(response.product);
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }

        setError(
          getStaffProductsErrorMessage(
            requestError,
            "This Staff product could not be loaded.",
          ),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 0);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [isOpen, partNumber, reloadNonce, user?.role]);

  if (!isOpen) {
    return null;
  }

  return (
    <ProductModalShell
      isOpen
      eyebrow="Product Details"
      title={product?.name ?? partNumber}
      description="Read-only real catalog information for Staff."
      titleId="staff-real-product-details-modal-title"
      descriptionId="staff-real-product-details-modal-description"
      status={product ? <Badge>{formatLabel(product.status)}</Badge> : null}
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
      {isLoading ? (
        <div
          className="space-y-4 px-1 py-4"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="h-32 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
          <span className="sr-only">Loading product details</span>
        </div>
      ) : error ? (
        <div className="px-1 py-10 text-center" role="alert">
          <p className="font-semibold text-[#0B1930]">Unable to load product</p>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <button
            type="button"
            onClick={() => setReloadNonce((nonce) => nonce + 1)}
            className="mt-5 rounded-lg bg-[#0B1930] px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Retry
          </button>
        </div>
      ) : product ? (
        <ProductDetails product={product} />
      ) : null}
    </ProductModalShell>
  );
}

function ProductDetails({ product }: { product: StaffProduct }) {
  return (
    <>
      <section className="admin-order-modal-section">
        <div className="mb-5 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <div className="relative h-48 w-full">
            {product.img_url ? (
              <Image
                src={product.img_url}
                alt={`${product.brand} ${product.name}`}
                fill
                sizes="(max-width: 768px) 100vw, 640px"
                className="object-contain p-4"
              />
            ) : (
              <div className="grid h-full place-items-center text-sm text-slate-400">
                No product image available
              </div>
            )}
          </div>
        </div>
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
            <dd>{product.part_number}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt>Description</dt>
            <dd>{product.description || "No description available."}</dd>
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
            <dd>{product.category ?? "Not available"}</dd>
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
            <dd className="admin-order-modal-total">{formatCurrency(product.price)}</dd>
          </div>
          <div>
            <dt>Catalog Status</dt>
            <dd><Badge>{formatLabel(product.status)}</Badge></dd>
          </div>
          <div>
            <dt>Availability Field</dt>
            <dd><Badge>{formatLabel(product.availability_status)}</Badge></dd>
          </div>
        </dl>
      </section>

      <section className="admin-order-modal-section">
        <div className="admin-order-modal-section-title">
          <FontAwesomeIcon icon={faDatabase} aria-hidden="true" />
          <h3>Inventory</h3>
        </div>
        <div className="admin-order-review-notice">
          <FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" />
          <p>
            <strong>Inventory not tracked</strong>
            <span>
              The current database has no persisted stock quantity or branch inventory record for this product.
            </span>
          </p>
        </div>
      </section>

      <section className="admin-order-modal-section">
        <div className="admin-order-modal-section-title">
          <FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" />
          <h3>Record Information</h3>
        </div>
        <dl className="admin-order-modal-detail-grid">
          <div>
            <dt>Created</dt>
            <dd>{formatDate(product.created_at)}</dd>
          </div>
          <div>
            <dt>Last Updated</dt>
            <dd>{formatDate(product.updated_at)}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
