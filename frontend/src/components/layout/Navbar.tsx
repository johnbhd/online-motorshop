"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faCartShopping,
  faClipboardList,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

const navigationItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/staff", label: "Staff" },
  { href: "/admin", label: "Admin" },
];

const FLOAT_THRESHOLD = 64;
const SCROLL_DIRECTION_TOLERANCE = 8;

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const previousScrollY = lastScrollY.current;
      const scrollDelta = currentScrollY - previousScrollY;
      const crossedFloatThreshold =
        previousScrollY <= FLOAT_THRESHOLD && currentScrollY > FLOAT_THRESHOLD;

      if (currentScrollY <= FLOAT_THRESHOLD) {
        setIsScrolled(false);
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      setIsScrolled(true);

      if (isMobileMenuOpen) {
        setIsVisible(true);
      } else if (crossedFloatThreshold) {
        setIsVisible(true);
      } else if (scrollDelta > SCROLL_DIRECTION_TOLERANCE) {
        setIsVisible(false);
      } else if (scrollDelta < -SCROLL_DIRECTION_TOLERANCE) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    lastScrollY.current = window.scrollY;
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    const closeOnDesktopResize = () => {
      if (window.innerWidth > 900) {
        setIsMobileMenuOpen(false);
      }
    };

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnDesktopResize);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnDesktopResize);
    };
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const openMobileMenu = () => {
    setIsVisible(true);
    setIsMobileMenuOpen(true);
  };

  const isActiveNavigationItem = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <header
        className={`site-header ${isScrolled ? "site-header--scrolled" : ""} ${isVisible ? "site-header--visible" : "site-header--hidden"} ${isMobileMenuOpen ? "site-header--menu-open" : ""}`}
      >
      <div className="site-header-inner">
        <Link href="/" className="site-header-brand">
          <Image
            src="/branding/logo.png"
            alt="ALD Motorshop logo"
            width={44}
            height={44}
            className="site-header-logo"
          />
          <span className="site-header-brand-text">
            <strong>ALD Motorshop</strong>
            <small>Motorcycle Parts Trading</small>
          </span>
        </Link>

        <nav className="site-header-nav" aria-label="Main navigation">
          {navigationItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`site-header-nav-link${isActiveNavigationItem(item.href) ? " is-active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="site-header-actions">
          <Link className="site-header-track" href="/#home-ordering">
            Track Order
          </Link>
          <span className="site-header-divider" aria-hidden="true" />
          <Link
            className="site-header-cart"
            href="/#home-products"
            aria-label="Shopping cart, 0 items"
          >
            <FontAwesomeIcon icon={faCartShopping} aria-hidden="true" />
            <span className="site-header-cart-badge" aria-hidden="true">
              0
            </span>
          </Link>
          <Link className="site-header-guest" href="/auth/login">
            Sign In or Continue as Guest
          </Link>
        </div>

        <button
          className="site-header-menu-toggle"
          type="button"
          aria-label="Open navigation menu"
          aria-expanded={isMobileMenuOpen}
          aria-controls="site-mobile-nav"
          onClick={openMobileMenu}
        >
          <FontAwesomeIcon icon={faBars} aria-hidden="true" />
        </button>
      </div>
      </header>

      {isMobileMenuOpen ? (
        <>
          <button
            className="site-mobile-nav-overlay"
            type="button"
            aria-label="Close navigation menu"
            onClick={closeMobileMenu}
          />
          <aside
            className="site-mobile-nav"
            id="site-mobile-nav"
            aria-label="Mobile navigation"
          >
            <div className="site-mobile-nav-header">
              <strong>Menu</strong>
              <button
                className="site-mobile-nav-close"
                type="button"
                aria-label="Close navigation menu"
                onClick={closeMobileMenu}
              >
                <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
              </button>
            </div>

            <nav className="site-mobile-nav-links" aria-label="Main navigation">
              {navigationItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`site-mobile-nav-link${isActiveNavigationItem(item.href) ? " is-active" : ""}`}
                  onClick={closeMobileMenu}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="site-mobile-nav-actions">
              <Link
                className="site-mobile-nav-action"
                href="/#home-ordering"
                onClick={closeMobileMenu}
              >
                <FontAwesomeIcon icon={faClipboardList} aria-hidden="true" />
                <span>Track Order</span>
              </Link>
              <Link
                className="site-mobile-nav-action"
                href="/#home-products"
                onClick={closeMobileMenu}
              >
                <FontAwesomeIcon icon={faCartShopping} aria-hidden="true" />
                <span>Cart</span>
                <span className="site-mobile-nav-cart-badge">0</span>
              </Link>
              <Link
                className="site-mobile-nav-action"
                href="/auth/login"
                onClick={closeMobileMenu}
              >
                <FontAwesomeIcon icon={faUser} aria-hidden="true" />
                <span>Sign In or Continue as Guest</span>
              </Link>
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
