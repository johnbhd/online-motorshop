"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudArrowUp } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  OPEN_STAFF_CHAT_EVENT,
  type OpenStaffChatDetail,
} from "../chatbot/chatbotEvents";
import type { ContactInquiryDraft } from "../chatbot/chatbotTypes";
import {
  contactArrowIcon,
  contactNeeds,
} from "./contactData";

export default function ContactForm() {
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [status, setStatus] = useState(
    "Your inquiry will be sent directly to ALD Support for review.",
  );
  const { user } = useAuth();
  const fullNameInputRef = useRef<HTMLInputElement>(null);
  const contactNumberInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (fullNameInputRef.current?.value.trim() === "") {
      fullNameInputRef.current.value = user.customer?.full_name || user.name;
    }

    if (contactNumberInputRef.current?.value.trim() === "") {
      contactNumberInputRef.current.value =
        user.customer?.contact_number || "";
    }

    if (emailInputRef.current?.value.trim() === "") {
      emailInputRef.current.value = user.customer?.email || user.email;
    }
  }, [user]);

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedPhoto(event.target.files?.[0] ?? null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const value = (name: string) => String(formData.get(name) ?? "").trim();
    const inquiryTypeLabels: Record<string, string> = {
      availability: "Product Availability",
      price: "Product Price",
      compatibility: "Motorcycle Part Compatibility",
      order: "Existing Order",
      payment: "Payment Concern",
      delivery: "Lalamove Delivery",
      promo: "Store Promo",
      service: "Maintenance or Repair Service",
    };
    const branchLabels: Record<string, string> = {
      manila: "Manila Branch",
      makati: "Makati Branch",
      imus: "Imus Branch",
    };
    const brandLabels: Record<string, string> = {
      honda: "Honda",
      yamaha: "Yamaha",
      suzuki: "Suzuki",
    };
    const inquiryType = value("inquiryType");
    const brand = value("brand");
    const photo = formData.get("photo");
    const inquiry: ContactInquiryDraft = {
      fullName: value("fullName"),
      contactNumber: value("contactNumber"),
      email: value("email"),
      inquiryType: inquiryTypeLabels[inquiryType] ?? inquiryType,
      preferredBranch: branchLabels[value("branch")] ?? value("branch"),
      motorcycle: [brandLabels[brand] ?? brand, value("modelYear")]
        .filter(Boolean)
        .join(" "),
      productNeeded: value("partNeeded"),
      orderReference: value("orderRef"),
      message: value("message"),
      photo:
        photo instanceof File && photo.size > 0 ? photo : selectedPhoto,
    };
    const detail: OpenStaffChatDetail = {
      inquiry,
      onSent: () => {
        form.reset();
        setSelectedPhoto(null);
        setStatus("Your inquiry was sent to ALD Support.");
      },
    };

    setStatus("Review your inquiry in ALD Support, then confirm to send it.");
    window.dispatchEvent(
      new CustomEvent<OpenStaffChatDetail>(OPEN_STAFF_CHAT_EVENT, { detail }),
    );
  };

  return (
    <section
      className="contact-section contact-form-section"
      aria-labelledby="contact-form-title"
    >
      <div className="contact-shell">
        <p className="contact-eyebrow contact-inquiry-eyebrow">Send an inquiry</p>

        <div className="contact-inquiry-grid">
          <div className="contact-needs-panel">
            <h2 className="contact-needs-title">Tell Us What You Need</h2>
            <p className="contact-needs-text">
              Provide your motorcycle and product details so the ALD team can
              understand your concern and assist you more efficiently.
            </p>

            <div className="contact-needs-grid">
              {contactNeeds.map((need) => (
                <div className="contact-needs-item" key={need.id}>
                  <span className="contact-needs-icon" aria-hidden="true">
                    <FontAwesomeIcon icon={need.icon} />
                  </span>
                  <span className="contact-needs-label">{need.label}</span>
                </div>
              ))}
            </div>

            <p className="contact-needs-footnote">
              For an existing order, prepare your ALD order reference number and
              contact information.
            </p>
          </div>

          <form
            className="contact-inquiry-form"
            id="contact-form"
            onSubmit={handleSubmit}
            aria-describedby="contact-form-status"
          >
            <h2 className="contact-inquiry-form-title" id="contact-form-title">
              Contact ALD Motorshop
            </h2>
            <p className="contact-inquiry-form-text">
              Complete the form with your contact and product information as
              possible.
            </p>

            <div className="contact-form-grid">
              <div className="contact-field">
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your complete name"
                  required
                  ref={fullNameInputRef}
                />
              </div>

              <div className="contact-field">
                <label htmlFor="contactNumber">Contact Number</label>
                <input
                  id="contactNumber"
                  name="contactNumber"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Enter your mobile number"
                  required
                  ref={contactNumberInputRef}
                />
              </div>

              <div className="contact-field">
                <label htmlFor="email">
                  Email Address <span className="contact-field-optional">(optional)</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  ref={emailInputRef}
                />
              </div>

              <div className="contact-field">
                <label htmlFor="inquiryType">Inquiry Type</label>
                <select id="inquiryType" name="inquiryType" defaultValue="" required>
                  <option value="" disabled>
                    Select an inquiry category
                  </option>
                  <option value="availability">Product Availability</option>
                  <option value="price">Product Price</option>
                  <option value="compatibility">
                    Motorcycle Part Compatibility
                  </option>
                  <option value="order">Existing Order</option>
                  <option value="payment">Payment Concern</option>
                  <option value="delivery">Lalamove Delivery</option>
                  <option value="promo">Store Promo</option>
                  <option value="service">Maintenance or Repair Service</option>
                </select>
              </div>

              <div className="contact-field">
                <label htmlFor="branch">Preferred Branch</label>
                <select id="branch" name="branch" defaultValue="">
                  <option value="" disabled>
                    Select your preferred branch
                  </option>
                  <option value="manila">Manila Branch</option>
                  <option value="makati">Makati Branch</option>
                  <option value="imus">Imus Branch</option>
                </select>
              </div>

              <div className="contact-field">
                <label htmlFor="brand">Motorcycle Brand</label>
                <select id="brand" name="brand" defaultValue="">
                  <option value="" disabled>
                    Select your motorcycle brand
                  </option>
                  <option value="honda">Honda</option>
                  <option value="yamaha">Yamaha</option>
                  <option value="suzuki">Suzuki</option>
                </select>
              </div>

              <div className="contact-field">
                <label htmlFor="modelYear">Motorcycle Model and Year</label>
                <input
                  id="modelYear"
                  name="modelYear"
                  type="text"
                  placeholder="e.g. Yamaha NMAX 155, 2023"
                />
              </div>

              <div className="contact-field">
                <label htmlFor="partNeeded">Product or Part Needed</label>
                <input
                  id="partNeeded"
                  name="partNeeded"
                  type="text"
                  placeholder="Enter product name, part number, or description"
                />
              </div>

              <div className="contact-field contact-field-full">
                <label htmlFor="orderRef">
                  Order Reference Number <span className="contact-field-optional">(optional)</span>
                </label>
                <input
                  id="orderRef"
                  name="orderRef"
                  type="text"
                  placeholder="e.g. ALD-2025-000123"
                />
              </div>

              <div className="contact-field contact-field-full">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  placeholder="Describe your inquiry or concern"
                  required
                />
              </div>

              <div className="contact-field contact-field-full">
                <span className="contact-field-label">
                  Upload Product or Part Photo{" "}
                  <span className="contact-field-optional">(optional)</span>
                </span>
                <label className="contact-upload-drop" htmlFor="photo">
                  <FontAwesomeIcon
                    className="contact-upload-icon"
                    icon={faCloudArrowUp}
                    aria-hidden="true"
                  />
                  <span className="contact-upload-text">
                    Drag and drop an image here
                    <br />
                    or choose a file from your device
                  </span>
                  <span className="contact-upload-button">Choose Photo</span>
                  <input
                    id="photo"
                    name="photo"
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    hidden
                    onChange={handlePhotoChange}
                  />
                </label>
                <span className="contact-upload-hint">
                  Accepted formats: JPG, PNG, WEBP
                  {selectedPhoto ? ` · ${selectedPhoto.name}` : ""}
                </span>
              </div>
            </div>

            <label className="contact-consent">
              <input type="checkbox" name="consent" required />
              <span>
                I confirm that the information provided is accurate and true to
                the best of my knowledge. I understand this is not for official
                transactions.
              </span>
            </label>

            <p className="contact-form-status" id="contact-form-status" role="status" aria-live="polite">
              {status}
            </p>

            <button className="contact-submit-button" type="submit">
              Send Inquiry
              <FontAwesomeIcon icon={contactArrowIcon} aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
