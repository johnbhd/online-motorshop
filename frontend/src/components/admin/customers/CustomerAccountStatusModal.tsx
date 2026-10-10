"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan, faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import BranchModalShell from "@/components/admin/branches/BranchModalShell";
import type { AdminCustomerDetail } from "@/lib/adminCustomerTypes";

type CustomerAccountStatusModalProps = {
  customer: AdminCustomerDetail;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function CustomerAccountStatusModal({
  customer,
  isSubmitting,
  onClose,
  onConfirm,
}: CustomerAccountStatusModalProps) {
  const isSuspending = customer.account?.status === "active";
  const action = isSuspending ? "Suspend" : "Unsuspend";
  const icon = isSuspending ? faBan : faRotateLeft;

  return (
    <BranchModalShell
      isOpen
      eyebrow="Customer Account"
      title={`${action} customer?`}
      description={
        isSuspending
          ? `${customer.name} will no longer be able to sign in to ALD Motorshop.`
          : `${customer.name} will be able to sign in to ALD Motorshop again.`
      }
      titleId="admin-customer-account-status-title"
      descriptionId="admin-customer-account-status-description"
      onClose={onClose}
      footer={
        <div className="flex w-full justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="admin-order-modal-button admin-order-modal-button-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={
              isSuspending
                ? "admin-order-modal-button admin-order-modal-button-danger"
                : "admin-order-modal-button admin-order-modal-button-primary"
            }
          >
            <FontAwesomeIcon icon={icon} aria-hidden="true" />
            {isSubmitting ? `${action}ing...` : `${action} customer`}
          </button>
        </div>
      }
    >
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        {isSuspending
          ? "Existing orders, payments, reviews, messages, and fulfillment records will remain unchanged. Current customer sessions will be signed out."
          : "This restores access to the existing account. Historical records remain unchanged."}
      </div>
    </BranchModalShell>
  );
}
