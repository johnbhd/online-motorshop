"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone } from "@fortawesome/free-solid-svg-icons";
import {
  contactBranches,
  contactHeroIcon,
} from "./contactData";

export default function ContactHero() {
  const [activeBranchIndex, setActiveBranchIndex] = useState(0);

  useEffect(() => {
    const carouselTimer = window.setInterval(() => {
      setActiveBranchIndex((currentIndex) =>
        currentIndex === contactBranches.length - 1 ? 0 : currentIndex + 1,
      );
    }, 3000);

    return () => {
      window.clearInterval(carouselTimer);
    };
  }, []);

  const activeBranch = contactBranches[activeBranchIndex];

  return (
    <section className="contact-hero" aria-labelledby="contact-page-title">
      <div className="contact-shell contact-hero-grid">
        <div className="contact-hero-content">
          <p className="contact-eyebrow">Get in touch</p>
          <h1 id="contact-page-title">Contact ALD Motorshop</h1>
          <p className="contact-hero-description">
            Need help finding a motorcycle part, confirming a pickup request,
            or asking about delivery? Contact ALD Motorshop and our team can
            help you with the next step.
          </p>
          <div className="contact-hero-actions">
            <a
              className="contact-button contact-button-primary"
              href="tel:+639958691174"
            >
              <FontAwesomeIcon icon={faPhone} aria-hidden="true" />
              Call ALD Motorshop
            </a>
            <Link
              className="contact-button contact-button-secondary"
              href="#contact-form"
            >
              <FontAwesomeIcon icon={contactHeroIcon} aria-hidden="true" />
              Send an inquiry
            </Link>
          </div>
        </div>

        <div className="contact-hero-image" aria-label="ALD Motorshop branch images">
          <div className="contact-hero-image-track">
            {contactBranches.map((branch, branchIndex) => (
              <div
                className={`contact-hero-image-slide${
                  branchIndex === activeBranchIndex ? " is-active" : ""
                }`}
                key={branch.id}
                aria-hidden={branchIndex !== activeBranchIndex}
              >
                <Image
                  src={branch.image}
                  alt={`ALD Motorshop ${branch.name}`}
                  fill
                  priority={branchIndex === 0}
                  sizes="(max-width: 760px) 100vw, 38vw"
                />
              </div>
            ))}
          </div>

          <div className="contact-hero-image-caption" aria-live="polite">
            <span>Featured branch</span>
            <strong>{activeBranch.name}</strong>
            <small>{activeBranch.address}</small>
          </div>

          <div className="contact-hero-image-dots" aria-label="Choose a branch image">
            {contactBranches.map((branch, branchIndex) => (
              <button
                className={`contact-hero-image-dot${
                  branchIndex === activeBranchIndex ? " is-active" : ""
                }`}
                type="button"
                key={branch.id}
                aria-label={`Show ${branch.name} image`}
                aria-current={branchIndex === activeBranchIndex}
                onClick={() => setActiveBranchIndex(branchIndex)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
