"use client";

import { useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import type { AdminProduct } from "@/lib/mock/admin";
import ProductFormFields from "./ProductFormFields";
import ProductModalShell from "./ProductModalShell";
import {
  createEmptyProductForm,
  productFromForm,
  type ProductFormErrors,
  type ProductFormOptions,
  type ProductFormState,
  validateProductForm,
} from "./productForm";

export type CreateProductModalProps = ProductFormOptions & {
  isOpen: boolean;
  existingProducts: AdminProduct[];
  onClose: () => void;
  onCreate: (product: AdminProduct) => void;
};

export default function CreateProductModal({
  isOpen,
  existingProducts,
  onClose,
  onCreate,
  ...options
}: CreateProductModalProps) {
  const [form, setForm] = useState(() => createEmptyProductForm(options));
  const [errors, setErrors] = useState<ProductFormErrors>({});

  const updateField = (field: keyof ProductFormState, value: string) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
    setErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateProductForm(form, existingProducts);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onCreate(productFromForm(form));
  };

  return (
    <ProductModalShell
      isOpen={isOpen}
      eyebrow="Product Catalog"
      title="Add Product"
      description="Create a new product in the ALD motorcycle parts catalog."
      titleId="admin-create-product-modal-title"
      descriptionId="admin-create-product-modal-description"
      onClose={onClose}
      footer={
        <div className="admin-order-modal-footer-actions">
          <button
            className="admin-order-modal-button admin-order-modal-button-secondary"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="admin-order-modal-button admin-order-modal-button-primary"
            type="submit"
            form="create-product-form"
          >
            <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
            Create Product
          </button>
        </div>
      }
    >
      <ProductFormFields
        formId="create-product-form"
        values={form}
        errors={errors}
        {...options}
        onChange={updateField}
        onSubmit={handleSubmit}
      />
    </ProductModalShell>
  );
}
