"use client";

import { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpRightFromSquare,
  faLocationDot,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import type { AboutBranch } from "../aboutData";

export type BranchMapModalProps = {
  branch: AboutBranch | null;
  onClose: () => void;
};

function getMapEmbedUrl(address: string) {
  const encodedAddress = encodeURIComponent(address);

  return `https://www.google.com/maps?q=${encodedAddress}&output=embed`;
}

function getGoogleMapsUrl(address: string) {
  const encodedAddress = encodeURIComponent(address);

  return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
}

export default function BranchMapModal({
  branch,
  onClose,
}: BranchMapModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!branch) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousActiveElement = document.activeElement as HTMLElement | null;
    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      previousActiveElement?.focus();
    };
  }, [branch, onClose]);

  if (!branch) {
    return null;
  }

  const titleId = "about-map-modal-title";
  const addressId = "about-map-modal-address";
  const mapEmbedUrl = getMapEmbedUrl(branch.address);
  const googleMapsUrl = getGoogleMapsUrl(branch.address);

  return (
    <div className="about-map-modal-overlay">
      <button
        className="about-map-modal-backdrop"
        type="button"
        aria-label="Close branch map"
        onClick={onClose}
      />

      <section
        className="about-map-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={addressId}
      >
        <header className="about-map-modal-header">
          <div className="about-map-modal-heading">
            <p>Branch location</p>
            <h2 id={titleId}>ALD Motorshop — {branch.name}</h2>
          </div>

          <button
            ref={closeButtonRef}
            className="about-map-modal-close"
            type="button"
            aria-label="Close branch map"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
          </button>
        </header>

        <div className="about-map-modal-body">
          <address className="about-map-modal-address" id={addressId}>
            <FontAwesomeIcon icon={faLocationDot} aria-hidden="true" />
            <span>{branch.address}</span>
          </address>

          <div className="about-map-modal-map">
            <iframe
              className="about-map-modal-frame"
              src={mapEmbedUrl}
              title={`Map location for ALD Motorshop — ${branch.name}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>

        <footer className="about-map-modal-footer">
          <button
            className="about-map-modal-button"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
          <a
            className="about-map-modal-button about-map-modal-button--primary"
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} aria-hidden="true" />
            Open in Google Maps
          </a>
        </footer>
      </section>
    </div>
  );
}
