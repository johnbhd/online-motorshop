"use client";

import type { FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faLayerGroup,
  faTag,
} from "@fortawesome/free-solid-svg-icons";
import type {
  ProductFormErrors,
  ProductFormState,
} from "./productForm";

export type ProductFormFieldsProps = {
  formId: string;
  values: ProductFormState;
  errors: ProductFormErrors;
  brandOptions: string[];
  categoryOptions: string[];
  availabilityOptions: string[];
  statusOptions: string[];
  onChange: (field: keyof ProductFormState, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function FieldError({
  field,
  message,
}: {
  field: keyof ProductFormState;
  message?: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      id={`product-${field}-error`}
      className="text-xs font-medium text-red-600"
      role="alert"
    >
      {message}
    </p>
  );
}

export default function ProductFormFields({
  formId,
  values,
  errors,
  brandOptions,
  categoryOptions,
  availabilityOptions,
  statusOptions,
  onChange,
  onSubmit,
}: ProductFormFieldsProps) {
  return (
    <form
      id={formId}
      className="space-y-1"
      noValidate
      onSubmit={onSubmit}
    >
      <section className="admin-order-modal-section">
        <div className="admin-order-modal-section-title">
          <FontAwesomeIcon icon={faTag} aria-hidden="true" />
          <h3>Basic Information</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="admin-order-modal-field">
            <span>
              Product Name <b aria-hidden="true">*</b>
            </span>
            <input
              type="text"
              value={values.name}
              required
              aria-invalid={Boolean(errors.name)}
              aria-describedby={
                errors.name ? "product-name-error" : undefined
              }
              onChange={(event) => onChange("name", event.target.value)}
            />
            <FieldError field="name" message={errors.name} />
          </label>

          <label className="admin-order-modal-field">
            <span>
              Product Code <b aria-hidden="true">*</b>
            </span>
            <input
              type="text"
              value={values.partNumber}
              required
              aria-invalid={Boolean(errors.partNumber)}
              aria-describedby={
                errors.partNumber ? "product-partNumber-error" : undefined
              }
              onChange={(event) =>
                onChange("partNumber", event.target.value)
              }
            />
            <FieldError
              field="partNumber"
              message={errors.partNumber}
            />
          </label>
        </div>
      </section>

      <section className="admin-order-modal-section">
        <div className="admin-order-modal-section-title">
          <FontAwesomeIcon icon={faLayerGroup} aria-hidden="true" />
          <h3>Catalog Classification</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="admin-order-modal-field">
            <span>
              Brand <b aria-hidden="true">*</b>
            </span>
            <select
              value={values.brand}
              required
              aria-invalid={Boolean(errors.brand)}
              aria-describedby={
                errors.brand ? "product-brand-error" : undefined
              }
              onChange={(event) => onChange("brand", event.target.value)}
            >
              <option value="">Select a brand</option>
              {brandOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <FieldError field="brand" message={errors.brand} />
          </label>

          <label className="admin-order-modal-field">
            <span>
              Category <b aria-hidden="true">*</b>
            </span>
            <select
              value={values.category}
              required
              aria-invalid={Boolean(errors.category)}
              aria-describedby={
                errors.category ? "product-category-error" : undefined
              }
              onChange={(event) => onChange("category", event.target.value)}
            >
              <option value="">Select a category</option>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <FieldError field="category" message={errors.category} />
          </label>
        </div>
      </section>

      <section className="admin-order-modal-section">
        <div className="admin-order-modal-section-title">
          <FontAwesomeIcon icon={faCircleCheck} aria-hidden="true" />
          <h3>Pricing &amp; Availability</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="admin-order-modal-field">
            <span>
              Price <b aria-hidden="true">*</b>
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={values.price}
              required
              aria-invalid={Boolean(errors.price)}
              aria-describedby={
                errors.price ? "product-price-error" : undefined
              }
              onChange={(event) => onChange("price", event.target.value)}
            />
            <FieldError field="price" message={errors.price} />
          </label>

          <label className="admin-order-modal-field">
            <span>
              Availability <b aria-hidden="true">*</b>
            </span>
            <select
              value={values.availability}
              required
              aria-invalid={Boolean(errors.availability)}
              aria-describedby={
                errors.availability ? "product-availability-error" : undefined
              }
              onChange={(event) =>
                onChange("availability", event.target.value)
              }
            >
              <option value="">Select availability</option>
              {availabilityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <FieldError
              field="availability"
              message={errors.availability}
            />
          </label>

          <label className="admin-order-modal-field md:col-span-2">
            <span>
              Status <b aria-hidden="true">*</b>
            </span>
            <select
              value={values.status}
              required
              aria-invalid={Boolean(errors.status)}
              aria-describedby={
                errors.status ? "product-status-error" : undefined
              }
              onChange={(event) => onChange("status", event.target.value)}
            >
              <option value="">Select status</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <FieldError field="status" message={errors.status} />
          </label>
        </div>
      </section>
    </form>
  );
}
