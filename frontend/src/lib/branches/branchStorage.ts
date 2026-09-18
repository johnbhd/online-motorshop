export const SELECTED_BRANCH_STORAGE_KEY = "ald_selected_branch";

export function getBranchId(branchName: string): string {
  return branchName.toLowerCase().replace(/\s+branch$/, "");
}

export function saveSelectedBranchId(branchId: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(
      SELECTED_BRANCH_STORAGE_KEY,
      JSON.stringify(branchId),
    );
    return true;
  } catch {
    return false;
  }
}
