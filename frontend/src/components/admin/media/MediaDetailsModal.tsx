"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpRightFromSquare,
  faCloudArrowDown,
  faFile,
  faImage,
  faLink,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { AdminBadge } from "@/components/admin/AdminDataTable";
import BranchModalShell from "@/components/admin/branches/BranchModalShell";
import type { AdminMediaAsset } from "@/lib/adminMediaTypes";
import { formatBytes, formatDate, label, statusClasses } from "./mediaUtils";

export default function MediaDetailsModal({
  media,
  onClose,
}: {
  media: AdminMediaAsset | null;
  onClose: () => void;
}) {
  return (
    <BranchModalShell
      isOpen={Boolean(media)}
      eyebrow="Media Registry"
      title={media?.original_filename ?? "Media details"}
      description="Review the Cloudinary asset, its lifecycle status, and the record it belongs to."
      titleId="admin-media-details-title"
      descriptionId="admin-media-details-description"
      status={
        media ? (
          <AdminBadge>{media.status_label}</AdminBadge>
        ) : null
      }
      onClose={onClose}
      footer={
        media ? (
          <div className="flex w-full items-center justify-between gap-3">
            <a
              href={media.secure_url}
              target="_blank"
              rel="noreferrer"
              className="admin-order-modal-button admin-order-modal-button-secondary"
            >
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} aria-hidden="true" />
              Open asset
            </a>
            <button
              type="button"
              onClick={onClose}
              className="admin-order-modal-button admin-order-modal-button-secondary"
            >
              Close
            </button>
          </div>
        ) : null
      }
    >
      {media ? (
        <div className="space-y-5">
          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faImage} aria-hidden="true" />
              <h3>Preview</h3>
            </div>
            <a
              href={media.secure_url}
              target="_blank"
              rel="noreferrer"
              className="group block overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
            >
              <img
                src={media.secure_url}
                alt={media.original_filename ?? "Cloudinary media asset"}
                className="max-h-80 w-full object-contain transition group-hover:scale-[1.01]"
              />
            </a>
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faFile} aria-hidden="true" />
              <h3>Asset information</h3>
            </div>
            <dl className="admin-order-modal-detail-grid admin-order-modal-order-grid">
              <div>
                <dt>Purpose</dt>
                <dd>{media.purpose_label || label(media.purpose)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <span className={"inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset " + statusClasses(media.status)}>
                    {media.status_label || label(media.status)}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Original file</dt>
                <dd>{media.original_filename ?? "Not available"}</dd>
              </div>
              <div>
                <dt>Type / size</dt>
                <dd>{[media.mime_type, formatBytes(media.bytes)].filter(Boolean).join(" · ") || "Not available"}</dd>
              </div>
              <div>
                <dt>Uploaded</dt>
                <dd>{formatDate(media.uploaded_at)}</dd>
              </div>
              <div>
                <dt>Deleted</dt>
                <dd>{formatDate(media.deleted_at)}</dd>
              </div>
            </dl>
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faCloudArrowDown} aria-hidden="true" />
              <h3>Cloudinary reference</h3>
            </div>
            <dl className="admin-order-modal-detail-grid">
              <div>
                <dt>Public ID</dt>
                <dd className="break-all">{media.cloudinary_public_id ?? "Not available"}</dd>
              </div>
              <div>
                <dt>Resource type</dt>
                <dd>{media.resource_type || "Not available"}</dd>
              </div>
            </dl>
            {media.cleanup_error ? (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Cleanup issue: {media.cleanup_error}
              </p>
            ) : null}
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faLink} aria-hidden="true" />
              <h3>Linked record</h3>
            </div>
            {media.linked_record ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="font-semibold text-[#0B1930]">{media.linked_record.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {label(media.linked_record.type)} #{media.linked_record.id}
                    {media.linked_record.reference ? " · " + media.linked_record.reference : ""}
                  </p>
                </div>
                {media.linked_record.destination && media.linked_record.exists ? (
                  <Link
                    href={media.linked_record.destination}
                    onClick={onClose}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
                  >
                    View record
                    <FontAwesomeIcon icon={faArrowUpRightFromSquare} aria-hidden="true" />
                  </Link>
                ) : (
                  <span className="text-sm text-slate-500">Record no longer exists</span>
                )}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                This asset is not linked to a current record.
              </p>
            )}
          </section>

          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title">
              <FontAwesomeIcon icon={faUser} aria-hidden="true" />
              <h3>Registry history</h3>
            </div>
            <dl className="admin-order-modal-detail-grid">
              <div>
                <dt>Uploaded by</dt>
                <dd>{media.uploaded_by?.name ?? "System / legacy import"}</dd>
              </div>
              <div>
                <dt>Deleted by</dt>
                <dd>{media.deleted_by?.name ?? "Not deleted"}</dd>
              </div>
            </dl>
          </section>
        </div>
      ) : null}
    </BranchModalShell>
  );
}
