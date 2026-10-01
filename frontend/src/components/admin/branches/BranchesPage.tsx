"use client";

import { useCallback, useMemo, useState } from "react";
import { AdminBadge } from "@/components/admin/AdminDataTable";
import {
  adminBranches,
  adminStaff,
  type AdminStaff,
} from "@/lib/mock/admin";
import BranchStaffModal from "./BranchStaffModal";
import CreateBranchModal from "./CreateBranchModal";
import EditBranchModal from "./EditBranchModal";
import type { AdminBranch, BranchFormState } from "./branchForm";

type BranchModal = "create" | "edit" | "staff" | null;

function getAssignedStaff(
  branch: AdminBranch,
  staffMembers: AdminStaff[],
) {
  return staffMembers.filter(
    (staffMember) => staffMember.branch === branch.name,
  );
}

export default function Branches() {
  const [branches, setBranches] = useState<AdminBranch[]>(adminBranches);
  const [staffMembers, setStaffMembers] =
    useState<AdminStaff[]>(adminStaff);
  const [query, setQuery] = useState("");
  const [activeModal, setActiveModal] = useState<BranchModal>(null);
  const [selectedBranch, setSelectedBranch] =
    useState<AdminBranch | null>(null);

  const visible = useMemo(
    () =>
      branches.filter((branch) =>
        `${branch.name} ${branch.address}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [branches, query],
  );

  const statusOptions = useMemo(
    () => Array.from(new Set(branches.map((branch) => branch.status))),
    [branches],
  );

  const pickupBranchCount = branches.filter((branch) => branch.pickup).length;
  const activeStaffCount = staffMembers.filter(
    (staffMember) => staffMember.status === "Active",
  ).length;

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setSelectedBranch(null);
  }, []);

  const openCreateModal = useCallback(() => {
    setSelectedBranch(null);
    setActiveModal("create");
  }, []);

  const openEditModal = useCallback((branch: AdminBranch) => {
    setSelectedBranch(branch);
    setActiveModal("edit");
  }, []);

  const openStaffModal = useCallback((branch: AdminBranch) => {
    setSelectedBranch(branch);
    setActiveModal("staff");
  }, []);

  const createBranch = useCallback(
    (branch: BranchFormState) => {
      const newBranch: AdminBranch = {
        ...branch,
        staff: 0,
      };

      setBranches((currentBranches) => [...currentBranches, newBranch]);
      closeModal();
    },
    [closeModal],
  );

  const saveBranch = useCallback(
    (branchChanges: BranchFormState) => {
      if (!selectedBranch) {
        return;
      }

      const previousName = selectedBranch.name;

      setBranches((currentBranches) =>
        currentBranches.map((branch) =>
          branch === selectedBranch
            ? {
                ...branch,
                ...branchChanges,
              }
            : branch,
        ),
      );

      if (previousName !== branchChanges.name) {
        setStaffMembers((currentStaff) =>
          currentStaff.map((staffMember) =>
            staffMember.branch === previousName
              ? {
                  ...staffMember,
                  branch: branchChanges.name,
                }
              : staffMember,
          ),
        );
      }

      closeModal();
    },
    [closeModal, selectedBranch],
  );

  const summary = [
    [String(branches.length), "Total Branches", "Current branch records"],
    [
      String(pickupBranchCount),
      "Pickup Available",
      "Branches offering store pickup",
    ],
    [
      String(activeStaffCount),
      "Active Staff",
      "Active staff assigned across branches",
    ],
  ];

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">
            Branch Management
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl">
            ALD Branches
          </h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Review store pickup availability, staff assignments, and branch
            information.
          </p>
        </div>
        <button
          className="min-h-11 rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white"
          type="button"
          onClick={openCreateModal}
        >
          + Add Branch
        </button>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {summary.map(([value, label, desc]) => (
          <article
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-3xl font-bold text-[#0B1930]">{value}</p>
            <h3 className="mt-1 font-semibold text-[#0B1930]">{label}</h3>
            <p className="mt-1 text-sm text-slate-500">{desc}</p>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="sr-only" htmlFor="admin-branch-search">
          Search branches or address
        </label>
        <input
          id="admin-branch-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-h-11 w-full max-w-md rounded-lg border border-slate-300 px-3 text-sm"
          placeholder="Search branches or address"
        />
      </section>

      <section className="grid gap-5">
        {visible.map((branch) => {
          const assignedStaff = getAssignedStaff(branch, staffMembers);

          return (
            <article
              key={branch.name}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <header className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <h2 className="text-lg font-semibold text-[#0B1930]">
                  {branch.name}
                </h2>
                <AdminBadge>{branch.status}</AdminBadge>
              </header>
              <div className="p-5 sm:p-6">
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
                  <Info label="Address" value={branch.address} />
                  <Info label="Contact" value={branch.contact} />
                  <Info
                    label="Assigned Staff"
                    value={`${assignedStaff.length} Staff`}
                  />
                  <Info label="Operating Hours" value="Configured" />
                  <Info
                    label="Pickup"
                    value={
                      branch.pickup
                        ? "Store Pickup Available"
                        : "Store Pickup Unavailable"
                    }
                  />
                </div>
                <footer className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <span
                    className={`text-sm font-medium ${branch.pickup ? "text-emerald-700" : "text-slate-500"}`}
                  >
                    {branch.pickup
                      ? "⌂ Store Pickup Available"
                      : "⌂ Store Pickup Unavailable"}
                  </span>
                  <span className="flex gap-4">
                    <button
                      className="min-h-10 rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white"
                      type="button"
                      onClick={() => openEditModal(branch)}
                    >
                      Edit Branch
                    </button>
                    <button
                      className="text-sm font-semibold text-orange-600"
                      type="button"
                      onClick={() => openStaffModal(branch)}
                    >
                      View Staff
                    </button>
                  </span>
                </footer>
              </div>
            </article>
          );
        })}
        {!visible.length && (
          <p className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            No branches found.
          </p>
        )}
      </section>

      <CreateBranchModal
        key={activeModal === "create" ? "create" : "closed"}
        isOpen={activeModal === "create"}
        existingBranches={branches}
        statusOptions={statusOptions}
        onClose={closeModal}
        onCreate={createBranch}
      />
      <EditBranchModal
        key={selectedBranch?.name ?? "closed"}
        isOpen={activeModal === "edit"}
        branch={selectedBranch}
        existingBranches={branches}
        statusOptions={statusOptions}
        onClose={closeModal}
        onSave={saveBranch}
      />
      <BranchStaffModal
        key={`staff-${selectedBranch?.name ?? "closed"}`}
        isOpen={activeModal === "staff"}
        branch={selectedBranch}
        staff={
          selectedBranch
            ? getAssignedStaff(selectedBranch, staffMembers)
            : []
        }
        onClose={closeModal}
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-[#0B1930]">
        {value || "Not configured"}
      </p>
    </div>
  );
}
