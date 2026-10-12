"use client";

import { useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImage,
  faPaperPlane,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import type { ContactInquiryDraft } from "./chatbotTypes";

export type ContactInquiryPreviewProps = {
  inquiry: ContactInquiryDraft;
  isSending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ContactInquiryPreview({
  inquiry,
  isSending = false,
  onCancel,
  onConfirm,
}: ContactInquiryPreviewProps) {
  const photoPreviewUrl = useMemo(
    () => (inquiry.photo ? URL.createObjectURL(inquiry.photo) : null),
    [inquiry.photo],
  );

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  const fields = [
    ["Inquiry", inquiry.inquiryType],
    ["Name", inquiry.fullName],
    ["Contact", inquiry.contactNumber],
    ["Email", inquiry.email],
    ["Branch", inquiry.preferredBranch],
    ["Motorcycle", inquiry.motorcycle],
    ["Product / part", inquiry.productNeeded],
    ["Order reference", inquiry.orderReference],
  ].filter(([, value]) => value);

  return (
    <section
      className="ald-chatbot__inquiry-preview"
      aria-label="Contact inquiry preview"
    >
      <div className="ald-chatbot__inquiry-preview-header">
        <div>
          <p className="ald-chatbot__inquiry-preview-eyebrow">Contact inquiry</p>
          <h3>Review before sending</h3>
        </div>
        <button
          className="ald-chatbot__inquiry-close"
          type="button"
          aria-label="Cancel contact inquiry"
          onClick={onCancel}
          disabled={isSending}
        >
          <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
        </button>
      </div>

      <dl className="ald-chatbot__inquiry-fields">
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <p className="ald-chatbot__inquiry-message">{inquiry.message}</p>

      {photoPreviewUrl && (
        <a
          className="ald-chatbot__inquiry-photo"
          href={photoPreviewUrl}
          target="_blank"
          rel="noreferrer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoPreviewUrl} alt="Selected contact inquiry attachment" />
          <span>
            <FontAwesomeIcon icon={faImage} aria-hidden="true" />
            {inquiry.photo?.name}
          </span>
        </a>
      )}

      <div className="ald-chatbot__inquiry-actions">
        <button
          className="ald-chatbot__inquiry-cancel"
          type="button"
          onClick={onCancel}
          disabled={isSending}
        >
          Cancel
        </button>
        <button
          className="ald-chatbot__inquiry-send"
          type="button"
          onClick={onConfirm}
          disabled={isSending}
        >
          <FontAwesomeIcon icon={faPaperPlane} aria-hidden="true" />
          {isSending ? "Sending..." : "Confirm & send"}
        </button>
      </div>
    </section>
  );
}
