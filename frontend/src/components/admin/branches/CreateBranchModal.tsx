"use client";

import { useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import BranchFormFields from "./BranchFormFields";
import BranchModalShell from "./BranchModalShell";
import {
  branchFromForm,
  createEmptyBranchForm,
  type AdminBranch,
  type BranchFormErrors,
  type BranchFormState,
  validateBranchForm,
} from "./branchForm";

export type CreateBranchModalProps = {
  isOpen: boolean;
  existingBranches: AdminBranch[];
  statusOptions: string[];
  onClose: () => void;
  onCreate: (branch: BranchFormState) => void;
};

export default function CreateBranchModal({
  isOpen,
  existingBranches,
  statusOptions,
  onClose,
  onCreate,
}: CreateBranchModalProps) {
  const [form, setForm] = useState(() =>
    createEmptyBranchForm(statusOptions),
  );
  const [errors, setErrors] = useState<BranchFormErrors>({});

  const updateField = <Field extends keyof BranchFormState>(
    field: Field,
    value: BranchFormState[Field],
  ) => {
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

  const resetForm = () => {
    setForm(createEmptyBranchForm(statusOptions));
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateBranchForm(form, existingBranches);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const nextBranch = branchFromForm(form);
    setForm(createEmptyBranchForm(statusOptions));
    setErrors({});
    onCreate(nextBranch);
  };

  return (
    <BranchModalShell
      isOpen={isOpen}
      eyebrow="Branch Management"
      title="Add Branch"
      description="Create a new ALD Motorshop branch location."
      titleId="admin-create-branch-modal-title"
      descriptionId="admin-create-branch-modal-description"
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
            className="admin-order-modal-button admin-order-modal-button-primary"
            type="submit"
            form="create-branch-form"
          >
            <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
            Add Branch
          </button>
        </div>
      }
    >
      <BranchFormFields
        formId="create-branch-form"
        values={form}
        errors={errors}
        statusOptions={statusOptions}
        onChange={updateField}
        onSubmit={handleSubmit}
      />
    </BranchModalShell>
  );
}
