"use client";

import { useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { AdminBadge } from "@/components/admin/AdminDataTable";
import type { AdminProduct } from "@/lib/mock/admin";
import ProductFormFields from "./ProductFormFields";
import ProductModalShell from "./ProductModalShell";
import {
  getProductFormState,
  productFromForm,
  type ProductFormErrors,
  type ProductFormOptions,
  type ProductFormState,
  validateProductForm,
} from "./productForm";

export type ManageProductModalProps = ProductFormOptions & {
  isOpen: boolean;
  product: AdminProduct | null;
  existingProducts: AdminProduct[];
  onClose: () => void;
  onSave: (originalPartNumber: string, product: AdminProduct) => void;
};

export default function ManageProductModal({
  isOpen,
  product,
  existingProducts,
  onClose,
  onSave,
  ...options
}: ManageProductModalProps) {
  const [form, setForm] = useState<ProductFormState>(() =>
    product
      ? getProductFormState(product)
      : {
          name: "",
          partNumber: "",
          brand: "",
          category: "",
          price: "",
          availability: "",
          status: "",
        },
  );
  const [errors, setErrors] = useState<ProductFormErrors>({});

  if (!product) {
    return null;
  }

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
    const nextErrors = validateProductForm(
      form,
      existingProducts,
      product.partNumber,
    );
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSave(product.partNumber, productFromForm(form));
  };

  return (
    <ProductModalShell
      isOpen={isOpen}
      eyebrow="Product Details"
      title={product.name}
      description="Manage catalog information for this product."
      titleId="admin-manage-product-modal-title"
      descriptionId="admin-manage-product-modal-description"
      status={<AdminBadge>{product.status}</AdminBadge>}
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
            form="manage-product-form"
          >
            <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
            Save Changes
          </button>
        </div>
      }
    >
      <ProductFormFields
        formId="manage-product-form"
        values={form}
        errors={errors}
        {...options}
        onChange={updateField}
        onSubmit={handleSubmit}
      />
    </ProductModalShell>
  );
}
