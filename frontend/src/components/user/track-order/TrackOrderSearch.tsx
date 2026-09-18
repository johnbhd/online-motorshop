"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faMagnifyingGlass,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";

export default function TrackOrderSearch() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="track-order-search-panel">
      <div className="track-order-section-heading">
        <div>
          <p className="track-order-section-eyebrow">ORDER STATUS</p>
          <h2 id="track-order-search-title">Find Your Order</h2>
        </div>
        <span className="track-order-search-badge">
          <FontAwesomeIcon icon={faLock} aria-hidden="true" />
          <span>Private order details</span>
        </span>
      </div>
      <p className="track-order-search-intro">
        Use the reference number and contact number from your order request to
        view its latest status.
      </p>
      <form className="track-order-search-form" onSubmit={handleSubmit}>
        <div className="track-order-field">
          <label htmlFor="track-order-reference">Reference Number</label>
          <div className="track-order-input-wrap">
            <FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" />
            <input
              id="track-order-reference"
              name="reference"
              type="text"
              placeholder="e.g. ALD-2026-001024"
              autoComplete="off"
              aria-describedby="track-order-reference-help"
            />
          </div>
          <span id="track-order-reference-help" className="track-order-field-hint">
            Your ALD order request reference
          </span>
        </div>
        <div className="track-order-field">
          <label htmlFor="track-order-contact">Contact Number</label>
          <div className="track-order-input-wrap">
            <FontAwesomeIcon icon={faPhone} aria-hidden="true" />
            <input
              id="track-order-contact"
              name="contact"
              type="tel"
              placeholder="e.g. 0917 123 4567"
              autoComplete="tel"
              aria-describedby="track-order-contact-help"
            />
          </div>
          <span id="track-order-contact-help" className="track-order-field-hint">
            The contact number used for the request
          </span>
        </div>
        <button className="track-order-search-button" type="submit">
          <FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" />
          <span>Check Order Status</span>
        </button>
      </form>
      <p className="track-order-search-note">
        <FontAwesomeIcon icon={faLock} aria-hidden="true" />
        <span>
          This page currently shows a sample order request while live tracking
          is being prepared.
        </span>
      </p>
      {submitted ? (
        <p className="track-order-search-feedback" role="status">
          The sample order remains visible below. Live order lookup is not
          connected yet.
        </p>
      ) : null}
    </div>
  );
}
