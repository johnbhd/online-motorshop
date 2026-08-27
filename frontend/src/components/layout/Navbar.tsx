import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping } from "@fortawesome/free-solid-svg-icons";

const navigationItems = [
  { href: "/", label: "Home" },
  { href: "/#home-products", label: "Products" },
  { href: "/#home-categories", label: "Categories" },
  { href: "/about", label: "Branches" },
  { href: "/about", label: "About Us" },
];

export function Navbar() {
  return (
    <header className="site-header">
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
          {navigationItems.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              className={`site-header-nav-link${index === 0 ? " is-active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
          <a className="site-header-nav-link" href="tel:+639958691174">
            Contact
          </a>
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
      </div>
    </header>
  );
}
