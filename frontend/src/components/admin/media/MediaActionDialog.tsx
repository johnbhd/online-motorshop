"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotate, faTriangleExclamation, faTrash } from "@fortawesome/free-solid-svg-icons";
import BranchModalShell from "@/components/admin/branches/BranchModalShell";
import type { AdminMediaAsset } from "@/lib/adminMediaTypes";

export default function MediaActionDialog({
  media,
  action,
  submitting,
  onCancel,
  onConfirm,
}: {
  media: AdminMediaAsset | null;
  action: "delete" | "retry";
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isDelete = action === "delete";

  return (
    <BranchModalShell
      isOpen={Boolean(media)}
      eyebrow="Media Registry"
      title={isDelete ? "Delete orphaned asset?" : "Retry Cloudinary cleanup?"}
      description={isDelete
        ? "This removes the registry row after the Cloudinary asset is deleted."
        : "This retries the cleanup operation and keeps the lifecycle history in the registry."}
      titleId="admin-media-action-title"
      descriptionId="admin-media-action-description"
      onClose={onCancel}
      footer={
        <div className="flex w-full justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="admin-order-modal-button admin-order-modal-button-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className={"admin-order-modal-button " + (isDelete
              ? "admin-order-modal-button-danger"
              : "admin-order-modal-button-primary")}
          >
            <FontAwesomeIcon icon={isDelete ? faTrash : faRotate} aria-hidden="true" />
            {submitting ? "Working..." : isDelete ? "Delete asset" : "Retry cleanup"}
          </button>
        </div>
      }
    >
      {media ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" aria-hidden="true" />
            <p>
              {isDelete
                ? "Only an orphaned asset can be deleted from this screen. Confirm that no active business record still needs this file."
                : "The previous cleanup attempt failed. Retrying is safe and will update the registry status based on the Cloudinary result."}
            </p>
          </div>
          <dl className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="font-semibold text-slate-500">Asset</dt>
              <dd className="font-semibold text-[#0B1930]">{media.original_filename ?? "Unnamed asset"}</dd>
            </div>
            <div className="mt-2 flex flex-wrap justify-between gap-2">
              <dt className="font-semibold text-slate-500">Status</dt>
              <dd className="text-slate-700">{media.status_label}</dd>
            </div>
            <div className="mt-2 flex flex-wrap justify-between gap-2">
              <dt className="font-semibold text-slate-500">Purpose</dt>
              <dd className="text-slate-700">{media.purpose_label}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </BranchModalShell>
  );
}
