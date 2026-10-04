"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faStore,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { AdminBadge } from "@/components/admin/AdminDataTable";
import type { AdminStaff } from "@/lib/mock/admin";
import BranchModalShell from "./BranchModalShell";
import type { AdminBranch } from "./branchForm";

export type BranchStaffModalProps = {
  isOpen: boolean;
  branch: AdminBranch | null;
  staff: AdminStaff[];
  onClose: () => void;
};

export default function BranchStaffModal({
  isOpen,
  branch,
  staff,
  onClose,
}: BranchStaffModalProps) {
  if (!isOpen || !branch) {
    return null;
  }

  const staffDescription =
    staff.length === 1 ? "1 staff member assigned" : `${staff.length} staff assigned`;

  return (
    <BranchModalShell
      isOpen={isOpen}
      eyebrow="Branch Staff"
      title={branch.name}
      description={staffDescription}
      titleId="admin-branch-staff-modal-title"
      descriptionId="admin-branch-staff-modal-description"
      status={<AdminBadge>{branch.status}</AdminBadge>}
      onClose={onClose}
      footer={
        <>
          <span />
          <div className="admin-order-modal-footer-actions">
            <button
              className="admin-order-modal-button admin-order-modal-button-secondary"
              type="button"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </>
      }
    >
      <section className="admin-order-modal-section">
        <div className="admin-order-modal-section-title">
          <FontAwesomeIcon icon={faStore} aria-hidden="true" />
          <h3>Branch Summary</h3>
        </div>
        <dl className="admin-order-modal-detail-grid admin-order-modal-order-grid">
          <div>
            <dt>Branch</dt>
            <dd>{branch.name}</dd>
          </div>
          <div>
            <dt>Assigned Staff</dt>
            <dd>{staff.length}</dd>
          </div>
          <div>
            <dt>Pickup</dt>
            <dd>{branch.pickup ? "Available" : "Unavailable"}</dd>
          </div>
          <div>
            <dt>Branch Status</dt>
            <dd>{branch.status}</dd>
          </div>
        </dl>
      </section>

      <section className="admin-order-modal-section">
        <div className="admin-order-modal-section-title">
          <FontAwesomeIcon icon={faUsers} aria-hidden="true" />
          <h3>Assigned Staff</h3>
        </div>
        {staff.length ? (
          <div className="admin-order-items-table-wrap admin-branch-staff-table-wrap">
            <table className="admin-order-items-table admin-branch-staff-table">
              <thead>
                <tr>
                  <th scope="col">Staff</th>
                  <th scope="col">Role</th>
                  <th scope="col">Email</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((staffMember) => (
                  <tr key={staffMember.email}>
                    <td>{staffMember.name}</td>
                    <td>{staffMember.role}</td>
                    <td>{staffMember.email}</td>
                    <td>
                      <AdminBadge>{staffMember.status}</AdminBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            No staff are currently assigned to this branch.
          </div>
        )}
      </section>

      <section className="admin-order-modal-section">
        <div className="admin-order-modal-section-title">
          <FontAwesomeIcon icon={faCircleCheck} aria-hidden="true" />
          <h3>Staff Management</h3>
        </div>
        <p className="text-sm leading-6 text-slate-600">
          Staff account creation and branch assignment remain managed from the
          Staff Management page.
        </p>
      </section>
    </BranchModalShell>
  );
}
