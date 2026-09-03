import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faLocationDot,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import {
  faFacebookF,
  faFacebookMessenger,
  faInstagram,
} from "@fortawesome/free-brands-svg-icons";

type FooterLink = {
  label: string;
  href?: string;
};

type FooterLinkGroup = {
  title: string;
  links: FooterLink[];
};

const footerLinkGroups: FooterLinkGroup[] = [
  {
    title: "Shop",
    links: [
      { label: "All Products", href: "/#home-products" },
      { label: "Product Categories", href: "/#home-categories" },
      { label: "Featured Products", href: "/#home-products" },
      { label: "Honda Parts", href: "/#home-brands" },
      { label: "Yamaha Parts", href: "/#home-brands" },
      { label: "Suzuki Parts", href: "/#home-brands" },
    ],
  },
  {
    title: "Customer Support",
    links: [
      { label: "Track Order", href: "/#home-ordering" },
      { label: "How to Order", href: "/#home-ordering" },
      { label: "Store Pickup", href: "/about" },
      { label: "Lalamove Delivery", href: "/about" },
      { label: "Frequently Asked Questions" },
      { label: "Contact Us", href: "tel:+639958691174" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About ALD Motorshop", href: "/about" },
      { label: "Branch Locations", href: "/about" },
      { label: "Business Information", href: "/about" },
      { label: "Privacy Policy" },
      { label: "Terms and Conditions" },
      { label: "Staff Login", href: "/auth/login" },
    ],
  },
];

const footerSocials = [
  { label: "Facebook", icon: faFacebookF },
  { label: "Messenger", icon: faFacebookMessenger },
  { label: "Instagram", icon: faInstagram },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-brand-head">
              <Image
                src="/branding/logo.png"
                alt="ALD Motorshop logo"
                width={44}
                height={44}
                className="footer-logo"
              />
              <div>
                <h2>ALD Motorshop</h2>
                <p>Motorcycle Parts Trading</p>
              </div>
            </div>

            <p className="footer-description">
              Your trusted source for genuine and compatible motorcycle parts,
              with convenient store pickup and Lalamove delivery requests.
            </p>

            <div className="footer-socials" aria-label="ALD Motorshop social links">
              {footerSocials.map((social) => (
                <span
                  className="footer-social-icon"
                  aria-label={social.label}
                  key={social.label}
                >
                  <FontAwesomeIcon icon={social.icon} aria-hidden="true" />
                </span>
              ))}
            </div>
          </div>

          {footerLinkGroups.map((group) => (
            <nav className="footer-column" aria-label={group.title} key={group.title}>
              <h3>{group.title}</h3>
              <ul>
                {group.links.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      link.href.startsWith("/") ? (
                        <Link href={link.href}>{link.label}</Link>
                      ) : (
                        <a href={link.href}>{link.label}</a>
                      )
                    ) : (
                      <span className="footer-link-placeholder">{link.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="footer-contact-row">
          <div className="footer-contact-item">
            <span className="footer-contact-icon" aria-hidden="true">
              <FontAwesomeIcon icon={faPhone} />
            </span>
            <span>
              <strong>Contact ALD Motorshop</strong>
              <small>
                <a href="tel:+639958691174">+63 995 869 1174</a>
              </small>
              <small>
                <a href="mailto:aldopcorporation@gmail.com">
                  aldopcorporation@gmail.com
                </a>
              </small>
            </span>
          </div>

          <div className="footer-contact-item">
            <span className="footer-contact-icon" aria-hidden="true">
              <FontAwesomeIcon icon={faClock} />
            </span>
            <span>
              <strong>Business Hours</strong>
              <small>Contact branch for current hours</small>
            </span>
          </div>

          <Link className="footer-contact-item" href="/about">
            <span className="footer-contact-icon" aria-hidden="true">
              <FontAwesomeIcon icon={faLocationDot} />
            </span>
            <span>
              <strong>Visit Our Branches</strong>
              <small>View branch locations</small>
            </span>
          </Link>
        </div>

        <div className="footer-bottom">
          <span>
            &copy; {new Date().getFullYear()} ALD Motorcycle Parts Trading. All
            rights reserved.
          </span>
          <span className="footer-legal">
            <span>Privacy Policy</span>
            <span aria-hidden="true">&middot;</span>
            <span>Terms and Conditions</span>
            <span aria-hidden="true">&middot;</span>
            <span>Accessibility</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
