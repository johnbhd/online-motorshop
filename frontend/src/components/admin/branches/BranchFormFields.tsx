"use client";

import type { FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faCircleCheck,
  faClock,
  faPhone,
  faStore,
} from "@fortawesome/free-solid-svg-icons";
import type {
  BranchFormErrors,
  BranchFormState,
} from "./branchForm";

export type BranchFormFieldsProps = {
  formId: string;
  values: BranchFormState;
  errors: BranchFormErrors;
  statusOptions: string[];
  onChange: <Field extends keyof BranchFormState>(
    field: Field,
    value: BranchFormState[Field],
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function FieldError({
  field,
  message,
  formId,
}: {
  field: keyof BranchFormState;
  message?: string;
  formId: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      id={`${formId}-${field}-error`}
      className="text-xs font-medium text-red-600"
      role="alert"
    >
      {message}
    </p>
  );
}

export default function BranchFormFields({
  formId,
  values,
  errors,
  statusOptions,
  onChange,
  onSubmit,
}: BranchFormFieldsProps) {
  return (
    <form
      id={formId}
      className="space-y-1"
      noValidate
      onSubmit={onSubmit}
    >
      <section className="admin-order-modal-section">
        <div className="admin-order-modal-section-title">
          <FontAwesomeIcon icon={faStore} aria-hidden="true" />
          <h3>Branch Information</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="admin-order-modal-field">
            <span>
              Branch Name <b aria-hidden="true">*</b>
            </span>
            <input
              type="text"
              value={values.name}
              required
              aria-invalid={Boolean(errors.name)}
              aria-describedby={
                errors.name ? `${formId}-name-error` : undefined
              }
              onChange={(event) => onChange("name", event.target.value)}
            />
            <FieldError
              field="name"
              formId={formId}
              message={errors.name}
            />
          </label>

          <label className="admin-order-modal-field md:col-span-2">
            <span>
              Branch Address <b aria-hidden="true">*</b>
            </span>
            <textarea
              value={values.address}
              required
              rows={3}
              aria-invalid={Boolean(errors.address)}
              aria-describedby={
                errors.address ? `${formId}-address-error` : undefined
              }
              onChange={(event) => onChange("address", event.target.value)}
            />
            <FieldError
              field="address"
              formId={formId}
              message={errors.address}
            />
          </label>
        </div>
      </section>

      <section className="admin-order-modal-section">
        <div className="admin-order-modal-section-title">
          <FontAwesomeIcon icon={faPhone} aria-hidden="true" />
          <h3>Contact Information</h3>
        </div>
        <label className="admin-order-modal-field">
          <span>Contact Number</span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={values.contact}
            onChange={(event) => onChange("contact", event.target.value)}
          />
        </label>
      </section>

      <section className="admin-order-modal-section">
        <div className="admin-order-modal-section-title">
          <FontAwesomeIcon icon={faClock} aria-hidden="true" />
          <h3>Operating Hours</h3>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Detailed weekly hours are not stored in the current Branch model. The
          existing Branch page shows only the current configuration status.
        </div>
      </section>

      <section className="admin-order-modal-section">
        <div className="admin-order-modal-section-title">
          <FontAwesomeIcon icon={faBoxOpen} aria-hidden="true" />
          <h3>Pickup Configuration</h3>
        </div>
        <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-[#0B1930]">
          <input
            type="checkbox"
            checked={values.pickup}
            className="size-4 accent-orange-500"
            onChange={(event) => onChange("pickup", event.target.checked)}
          />
          <span>Store Pickup Available</span>
        </label>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Customers may select this branch for Store Pickup. Orders still
          require staff confirmation and preparation.
        </p>
      </section>

      <section className="admin-order-modal-section">
        <div className="admin-order-modal-section-title">
          <FontAwesomeIcon icon={faCircleCheck} aria-hidden="true" />
          <h3>Branch Status</h3>
        </div>
        <label className="admin-order-modal-field">
          <span>
            Status <b aria-hidden="true">*</b>
          </span>
          <select
            value={values.status}
            required
            aria-invalid={Boolean(errors.status)}
            aria-describedby={
              errors.status ? `${formId}-status-error` : undefined
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
          <FieldError
            field="status"
            formId={formId}
            message={errors.status}
          />
        </label>
      </section>
    </form>
  );
}
