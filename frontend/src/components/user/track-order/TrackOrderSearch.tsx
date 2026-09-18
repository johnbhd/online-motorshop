"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faMagnifyingGlass,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";

type TrackOrderSearchProps = {
  error: string;
  onSearch: (reference: string, contactNumber: string) => void;
};

export default function TrackOrderSearch({
  error,
  onSearch,
}: TrackOrderSearchProps) {
  const [reference, setReference] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [referenceError, setReferenceError] = useState("");
  const [contactError, setContactError] = useState("");

  useEffect(() => {
    const queryReference = new URLSearchParams(window.location.search).get(
      "reference",
    );

    if (queryReference) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- prefill the reference from the confirmation link after hydration
      setReference(queryReference);
    }
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextReferenceError = reference.trim()
      ? ""
      : "Enter your ALD order reference.";
    const nextContactError = contactNumber.trim()
      ? ""
      : "Enter the contact number used for the request.";

    setReferenceError(nextReferenceError);
    setContactError(nextContactError);

    if (nextReferenceError || nextContactError) {
      return;
    }

    onSearch(reference.trim(), contactNumber.trim());
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
        view its latest saved status.
      </p>
      <form
        className="track-order-search-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="track-order-field">
          <label htmlFor="track-order-reference">Reference Number</label>
          <div className="track-order-input-wrap">
            <FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" />
            <input
              id="track-order-reference"
              name="reference"
              type="text"
              value={reference}
              placeholder="e.g. ALD-2026-001024"
              autoComplete="off"
              aria-invalid={Boolean(referenceError)}
              aria-describedby="track-order-reference-help"
              onChange={(event) => {
                setReference(event.target.value);
                setReferenceError("");
              }}
            />
          </div>
          <span id="track-order-reference-help" className="track-order-field-hint">
            Your ALD order request reference
          </span>
          {referenceError ? (
            <span className="track-order-field-error">{referenceError}</span>
          ) : null}
        </div>
        <div className="track-order-field">
          <label htmlFor="track-order-contact">Contact Number</label>
          <div className="track-order-input-wrap">
            <FontAwesomeIcon icon={faPhone} aria-hidden="true" />
            <input
              id="track-order-contact"
              name="contact"
              type="tel"
              value={contactNumber}
              placeholder="e.g. 0917 123 4567"
              autoComplete="tel"
              aria-invalid={Boolean(contactError)}
              aria-describedby="track-order-contact-help"
              onChange={(event) => {
                setContactNumber(event.target.value);
                setContactError("");
              }}
            />
          </div>
          <span id="track-order-contact-help" className="track-order-field-hint">
            The contact number used for the request
          </span>
          {contactError ? (
            <span className="track-order-field-error">{contactError}</span>
          ) : null}
        </div>
        <button className="track-order-search-button" type="submit">
          <FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" />
          <span>Check Order Status</span>
        </button>
      </form>
      <p className="track-order-search-note">
        <FontAwesomeIcon icon={faLock} aria-hidden="true" />
        <span>
          This temporary lookup reads saved order requests from this browser.
        </span>
      </p>
      {error ? (
        <p className="track-order-search-feedback" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
