"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpFromBracket,
  faCircleInfo,
  faImage,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { formatPeso } from "../cart/cartData";
import { getPublicPaymentInstructions } from "@/lib/paymentInstructionsApi";
import type { PublicPaymentInstructions } from "@/lib/adminSettingsTypes";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type PaymentInstructionsModalProps = {
  orderReference: string;
  paymentMethod: string;
  amount: number | null;
  paymentStatus: string;
  proofImageUrl: string | null;
  canUpload: boolean;
  isSubmitting: boolean;
  submitError: string;
  onClose: () => void;
  onSubmit: (file: File) => void;
};

export default function PaymentInstructionsModal({
  orderReference,
  paymentMethod,
  amount,
  paymentStatus,
  proofImageUrl,
  canUpload,
  isSubmitting,
  submitError,
  onClose,
  onSubmit,
}: PaymentInstructionsModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [instructions, setInstructions] = useState<PublicPaymentInstructions | null>(null);
  const [instructionsError, setInstructionsError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    void getPublicPaymentInstructions(controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) {
          setInstructions(response.payment_instructions);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setInstructionsError(true);
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const previousActiveElement = document.activeElement as HTMLElement | null;
    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      previousActiveElement?.focus();
    };
  }, [isSubmitting, onClose]);

  const previewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    setFileError("");

    if (!file) {
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setSelectedFile(null);
      setFileError("Choose a JPG, PNG, or WEBP image.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setFileError("Payment proof must be 5 MB or smaller.");
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = () => {
    if (selectedFile && !isSubmitting) {
      onSubmit(selectedFile);
    }
  };

  const imageSource = previewUrl ?? proofImageUrl;
  const titleId = "payment-instructions-modal-title";
  const descriptionId = "payment-instructions-modal-description";

  return (
    <div className="track-order-payment-modal-overlay">
      <button
        className="track-order-payment-modal-backdrop"
        type="button"
        aria-label="Close payment instructions"
        onClick={() => {
          if (!isSubmitting) {
            onClose();
          }
        }}
      />
      <section
        className="track-order-payment-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <header className="track-order-payment-modal-header">
          <div>
            <p className="track-order-section-eyebrow">PAYMENT DETAILS</p>
            <h2 id={titleId}>Complete your payment</h2>
            <p id={descriptionId}>{orderReference}</p>
          </div>
          <button
            ref={closeButtonRef}
            className="track-order-payment-modal-close"
            type="button"
            aria-label="Close payment instructions"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
          </button>
        </header>

        <div className="track-order-payment-modal-body">
          <div className="track-order-payment-summary">
            <div>
              <span>Amount due</span>
              <strong>{amount === null ? "Amount unavailable" : formatPeso(amount)}</strong>
            </div>
            <div>
              <span>Payment method</span>
              <strong>{paymentMethod}</strong>
            </div>
            <div>
              <span>Payment status</span>
              <strong>{paymentStatus}</strong>
            </div>
          </div>

          <section className="track-order-payment-instructions" aria-labelledby="payment-instructions-title">
            <div className="track-order-payment-modal-section-heading">
              <FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" />
              <h3 id="payment-instructions-title">Payment instructions</h3>
            </div>
            {instructionsError ? (
              <p role="alert">
                Payment details could not be loaded. Please contact ALD Staff before
                sending payment.
              </p>
            ) : !instructions ? (
              <p aria-live="polite">Loading current payment details…</p>
            ) : !instructions.configured ? (
              <p>
                Online payment details have not been configured. Contact ALD Staff
                before sending payment.
              </p>
            ) : (
              <>
                <p>Send the exact amount due using the current details below.</p>
                <dl className="track-order-payment-destination">
                  {instructions.gcash_account_name ? (
                    <div>
                      <dt>Account name</dt>
                      <dd>{instructions.gcash_account_name}</dd>
                    </div>
                  ) : null}
                  {instructions.gcash_number ? (
                    <div>
                      <dt>GCash number</dt>
                      <dd>{instructions.gcash_number}</dd>
                    </div>
                  ) : null}
                  {instructions.payment_instructions ? (
                    <div className="track-order-payment-destination-note">
                      <dt>Instructions</dt>
                      <dd>{instructions.payment_instructions}</dd>
                    </div>
                  ) : null}
                  {instructions.qr_image_url ? (
                    <div className="track-order-payment-destination-qr">
                      <dt>Scan to pay</dt>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={instructions.qr_image_url}
                        alt="ALD Motorshop payment QR code"
                      />
                    </div>
                  ) : null}
                </dl>
                <ol>
                  <li>Keep your payment receipt or screenshot.</li>
                  <li>Upload the proof below for staff verification.</li>
                </ol>
              </>
            )}
          </section>

          {proofImageUrl && !canUpload ? (
            <section className="track-order-payment-proof-view" aria-labelledby="payment-proof-view-title">
              <div className="track-order-payment-modal-section-heading">
                <FontAwesomeIcon icon={faImage} aria-hidden="true" />
                <h3 id="payment-proof-view-title">Submitted proof</h3>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="track-order-payment-proof-image"
                src={imageSource ?? proofImageUrl}
                alt={`Submitted payment proof for ${orderReference}`}
              />
            </section>
          ) : null}

          {canUpload ? (
            <section className="track-order-payment-upload" aria-labelledby="payment-proof-upload-title">
              <div className="track-order-payment-modal-section-heading">
                <FontAwesomeIcon icon={faImage} aria-hidden="true" />
                <h3 id="payment-proof-upload-title">Proof of payment</h3>
              </div>
              <p>Upload your GCash or online-payment receipt. ALD Staff will review it before marking the payment paid.</p>
              <label className="track-order-payment-file-picker">
                <FontAwesomeIcon icon={faArrowUpFromBracket} aria-hidden="true" />
                <span>{selectedFile ? "Replace image" : "Select image"}</span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                />
              </label>
              {imageSource ? (
                <div className="track-order-payment-proof-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="track-order-payment-proof-image"
                    src={imageSource}
                    alt={selectedFile?.name ?? `Submitted payment proof for ${orderReference}`}
                  />
                  <div>
                    <strong>{selectedFile?.name ?? "Submitted payment proof"}</strong>
                    {selectedFile ? (
                      <button
                        className="track-order-payment-remove-file"
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        disabled={isSubmitting}
                      >
                        Remove selected image
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
              {fileError ? <p className="track-order-payment-error" role="alert">{fileError}</p> : null}
              {submitError ? <p className="track-order-payment-error" role="alert">{submitError}</p> : null}
            </section>
          ) : null}
        </div>

        <footer className="track-order-payment-modal-footer">
          <button
            className="track-order-payment-modal-button"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Close
          </button>
          {canUpload ? (
            <button
              className="track-order-payment-modal-button track-order-payment-modal-button--primary"
              type="button"
              onClick={handleSubmit}
              disabled={!selectedFile || isSubmitting}
            >
              {isSubmitting ? "Submitting…" : "Submit Payment Proof"}
            </button>
          ) : null}
        </footer>
      </section>
    </div>
  );
}
