"use client";

import { useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { AdminBadge } from "@/components/admin/AdminDataTable";
import BranchFormFields from "./BranchFormFields";
import BranchModalShell from "./BranchModalShell";
import {
  branchFromForm,
  getBranchFormState,
  type AdminBranch,
  type BranchFormErrors,
  type BranchFormState,
  validateBranchForm,
} from "./branchForm";

export type EditBranchModalProps = {
  isOpen: boolean;
  branch: AdminBranch | null;
  existingBranches: AdminBranch[];
  statusOptions: string[];
  onClose: () => void;
  onSave: (branch: BranchFormState) => void;
};

export default function EditBranchModal({
  isOpen,
  branch,
  existingBranches,
  statusOptions,
  onClose,
  onSave,
}: EditBranchModalProps) {
  const [form, setForm] = useState<BranchFormState | null>(() =>
    branch ? getBranchFormState(branch) : null,
  );
  const [errors, setErrors] = useState<BranchFormErrors>({});

  if (!isOpen || !branch || !form) {
    return null;
  }

  const updateField = <Field extends keyof BranchFormState>(
    field: Field,
    value: BranchFormState[Field],
  ) => {
    setForm((currentForm) =>
      currentForm
        ? {
            ...currentForm,
            [field]: value,
          }
        : currentForm,
    );
    setErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleClose = () => {
    setForm(getBranchFormState(branch));
    setErrors({});
    onClose();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateBranchForm(
      form,
      existingBranches,
      branch.name,
    );
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const nextBranch = branchFromForm(form);
    setForm(nextBranch);
    setErrors({});
    onSave(nextBranch);
  };

  return (
    <BranchModalShell
      isOpen={isOpen}
      eyebrow="Branch Details"
      title={branch.name}
      description="Manage branch information."
      titleId="admin-edit-branch-modal-title"
      descriptionId="admin-edit-branch-modal-description"
      status={<AdminBadge>{branch.status}</AdminBadge>}
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
            form="edit-branch-form"
          >
            <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
            Save Changes
          </button>
        </div>
      }
    >
      <BranchFormFields
        formId="edit-branch-form"
        values={form}
        errors={errors}
        statusOptions={statusOptions}
        onChange={updateField}
        onSubmit={handleSubmit}
      />
    </BranchModalShell>
  );
}
