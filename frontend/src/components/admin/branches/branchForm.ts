import type { adminBranches } from "@/lib/mock/admin";

export type AdminBranch = (typeof adminBranches)[number];

export type BranchFormState = Pick<
  AdminBranch,
  "name" | "address" | "contact" | "pickup" | "status"
>;

export type BranchFormErrors = Partial<
  Record<keyof BranchFormState, string>
>;

export function createEmptyBranchForm(
  statusOptions: string[],
): BranchFormState {
  return {
    name: "",
    address: "",
    contact: "",
    pickup: true,
    status: statusOptions[0] ?? "Active",
  };
}

export function getBranchFormState(
  branch: AdminBranch,
): BranchFormState {
  return {
    name: branch.name,
    address: branch.address,
    contact: branch.contact,
    pickup: branch.pickup,
    status: branch.status,
  };
}

export function validateBranchForm(
  values: BranchFormState,
  existingBranches: AdminBranch[],
  originalName?: string,
): BranchFormErrors {
  const errors: BranchFormErrors = {};
  const name = values.name.trim();
  const address = values.address.trim();

  if (!name) {
    errors.name = "Please enter a branch name.";
  }

  if (!address) {
    errors.address = "Please enter a branch address.";
  }

  if (name) {
    const normalizedName = name.toLowerCase();
    const normalizedOriginalName = originalName?.trim().toLowerCase();
    const isDuplicate = existingBranches.some((branch) => {
      const isCurrentBranch =
        normalizedOriginalName === branch.name.trim().toLowerCase();

      return !isCurrentBranch && branch.name.trim().toLowerCase() === normalizedName;
    });

    if (isDuplicate) {
      errors.name = "A branch with this name already exists.";
    }
  }

  if (!values.status) {
    errors.status = "Please select a branch status.";
  }

  return errors;
}

export function branchFromForm(
  values: BranchFormState,
): BranchFormState {
  return {
    name: values.name.trim(),
    address: values.address.trim(),
    contact: values.contact.trim(),
    pickup: values.pickup,
    status: values.status,
  };
}
