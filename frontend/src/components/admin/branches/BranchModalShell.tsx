"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

export type BranchModalShellProps = {
  isOpen: boolean;
  eyebrow: string;
  title: string;
  description: string;
  titleId: string;
  descriptionId: string;
  status?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
};

export default function BranchModalShell({
  isOpen,
  eyebrow,
  title,
  description,
  titleId,
  descriptionId,
  status,
  onClose,
  children,
  footer,
}: BranchModalShellProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
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
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="admin-order-modal-overlay">
      <button
        className="admin-order-modal-backdrop"
        type="button"
        aria-label={`Close ${title}`}
        onClick={onClose}
      />

      <section
        className="admin-order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <header className="admin-order-modal-header">
          <div className="admin-order-modal-heading">
            <p>{eyebrow}</p>
            <h2 id={titleId}>{title}</h2>
            <span id={descriptionId}>{description}</span>
          </div>

          <div className="admin-order-modal-header-meta">
            {status}
            <button
              ref={closeButtonRef}
              className="admin-order-modal-close"
              type="button"
              aria-label={`Close ${title}`}
              onClick={onClose}
            >
              <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="admin-order-modal-body">{children}</div>

        <footer className="admin-order-modal-footer">{footer}</footer>
      </section>
    </div>
  );
}
