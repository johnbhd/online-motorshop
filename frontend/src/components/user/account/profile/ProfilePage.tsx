"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardList,
  faEnvelope,
  faLocationDot,
  faPhone,
  faShieldHalved,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

import { useAuth } from "@/components/auth/AuthProvider";

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function ProfileDetail({
  icon,
  label,
  value,
}: {
  icon: typeof faUser;
  label: string;
  value: string;
}) {
  return (
    <div className="customer-profile-detail">
      <dt>
        <FontAwesomeIcon icon={icon} aria-hidden="true" />
        {label}
      </dt>
      <dd>{value}</dd>
    </div>
  );
}

export default function ProfilePage() {
  const { isLoading, user } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="customer-profile-page">
        <div className="customer-profile-loading" aria-live="polite">
          Loading your profile…
        </div>
      </div>
    );
  }

  const customer = user.customer;
  const initials = getInitials(user.name) || "ALD";

  return (
    <div className="customer-profile-page">
      <section
        className="customer-orders-hero"
        aria-labelledby="customer-profile-page-title"
      >
        <div className="customer-orders-shell">
          <p className="customer-orders-eyebrow">Customer Account</p>
          <h1 id="customer-profile-page-title">Profile</h1>
          <p>
            View the account details currently associated with your ALD Motorshop
            account.
          </p>
        </div>
      </section>

      <div className="customer-orders-shell customer-profile-content">
        <section
          className="customer-profile-card"
          aria-labelledby="profile-details-title"
        >
          <div className="customer-profile-card-header">
            <span className="customer-profile-avatar" aria-hidden="true">
              {initials}
            </span>
            <div>
              <p className="customer-orders-eyebrow">Signed-in customer</p>
              <h2 id="profile-details-title">{user.name}</h2>
              <p>
                Your profile information is shown from the current account
                session.
              </p>
            </div>
          </div>

          <dl className="customer-profile-detail-grid">
            <ProfileDetail icon={faUser} label="Full Name" value={user.name} />
            <ProfileDetail icon={faEnvelope} label="Email" value={user.email} />
            <ProfileDetail
              icon={faPhone}
              label="Contact Number"
              value={customer?.contact_number || "Not provided"}
            />
            <ProfileDetail
              icon={faLocationDot}
              label="Address"
              value={customer?.address || "Not provided"}
            />
          </dl>
        </section>

        <aside
          className="customer-profile-aside"
          aria-labelledby="profile-actions-title"
        >
          <div className="customer-profile-aside-heading">
            <FontAwesomeIcon icon={faShieldHalved} aria-hidden="true" />
            <h2 id="profile-actions-title">Account shortcuts</h2>
          </div>
          <p>
            Continue browsing your requests or use the public tracking page to
            check an order reference.
          </p>
          <div className="customer-profile-links">
            <Link className="customer-profile-link" href="/account/orders">
              <FontAwesomeIcon icon={faClipboardList} aria-hidden="true" />
              My Orders
            </Link>
            <Link className="customer-profile-link" href="/track-order">
              <FontAwesomeIcon icon={faClipboardList} aria-hidden="true" />
              Track Order
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
