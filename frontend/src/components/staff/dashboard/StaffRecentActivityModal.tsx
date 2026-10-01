"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faFileLines } from "@fortawesome/free-solid-svg-icons";

import ProductModalShell from "@/components/admin/products/ProductModalShell";
import { Badge } from "@/components/staff/PortalTable";
import type { Notification } from "@/lib/mock/staff";
import {
  getStaffActivityIcon,
  getStaffActivityOrderReference,
} from "./staffActivity";

export type StaffRecentActivityModalProps = {
  isOpen: boolean;
  activity: Notification | null;
  onClose: () => void;
};

export default function StaffRecentActivityModal({
  isOpen,
  activity,
  onClose,
}: StaffRecentActivityModalProps) {
  if (!isOpen || !activity) {
    return null;
  }

  const relatedOrderReference = getStaffActivityOrderReference(
    activity.description,
  );
  const activityState = activity.unread ? "Unread" : "Read";

  return (
    <ProductModalShell
      isOpen={isOpen}
      eyebrow="Activity Details"
      title={activity.title}
      description="Recent Staff activity"
      titleId="staff-recent-activity-modal-title"
      descriptionId="staff-recent-activity-modal-description"
      status={<Badge>{activity.type}</Badge>}
      onClose={onClose}
      footer={
        <>
          <span>Read-only Staff activity view</span>
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
          <FontAwesomeIcon
            icon={getStaffActivityIcon(activity.type)}
            aria-hidden="true"
          />
          <h3>Activity Information</h3>
        </div>
        <dl className="admin-order-modal-detail-grid">
          <div>
            <dt>Activity Type</dt>
            <dd>{activity.type}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{activity.time}</dd>
          </div>
          <div>
            <dt>Notification State</dt>
            <dd>
              <Badge>{activityState}</Badge>
            </dd>
          </div>
        </dl>
      </section>

      <section className="admin-order-modal-section">
        <div className="admin-order-modal-section-title">
          <FontAwesomeIcon icon={faFileLines} aria-hidden="true" />
          <h3>Activity Details</h3>
        </div>
        <p className="break-words rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
          {activity.description}
        </p>
      </section>

      {relatedOrderReference ? (
        <section className="admin-order-modal-section">
          <div className="admin-order-modal-section-title">
            <FontAwesomeIcon icon={faClock} aria-hidden="true" />
            <h3>Related Record</h3>
          </div>
          <dl className="admin-order-modal-detail-grid">
            <div>
              <dt>Order Reference</dt>
              <dd>{relatedOrderReference}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            The current activity record provides this reference only; no
            related Staff detail action is available from the current data.
          </p>
        </section>
      ) : null}
    </ProductModalShell>
  );
}
