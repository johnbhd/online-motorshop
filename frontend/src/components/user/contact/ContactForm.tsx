"use client";

import type { FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudArrowUp } from "@fortawesome/free-solid-svg-icons";
import {
  contactArrowIcon,
  contactNeeds,
} from "./contactData";

export default function ContactForm() {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
                  />
                </label>
                <span className="contact-upload-hint">
                  Accepted formats: JPG, PNG, WEBP
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

            <p className="contact-form-status" id="contact-form-status">
              Online message submission is not connected yet. Please call +63
              995 869 1174 for a response.
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
