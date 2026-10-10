"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faBell,
  faCartShopping,
  faCircleUser,
  faClipboardList,
  faRightFromBracket,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { getRedirectPathForRole } from "@/lib/auth/authApi";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  CART_UPDATED_EVENT,
  getStoredCartQuantity,
} from "@/components/user/cart/cartStorage";
import NotificationDropdown from "@/components/user/notifications/NotificationDropdown";
import { useCustomerNotifications } from "@/components/user/notifications/useCustomerNotifications";

const navigationItems = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const FLOAT_THRESHOLD = 64;
const SCROLL_DIRECTION_TOLERANCE = 8;

function formatNotificationCount(count: number): string {
  return count > 99 ? "99+" : String(count);
}

function getSessionLinkLabel(role: "customer" | "staff" | "admin") {
  if (role === "admin") {
    return "Admin Portal";
  }

  if (role === "staff") {
    return "Staff Portal";
  }

  return "My Orders";
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading: isAuthLoading, logout, user } = useAuth();
  const customerNotifications = useCustomerNotifications({
    enabled: !isAuthLoading && user?.role === "customer",
    perPage: 5,
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [cartQuantity, setCartQuantity] = useState(0);
  const lastScrollY = useRef(0);
  const accountRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const mobileNotificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncCartQuantity = () => {
      setCartQuantity(getStoredCartQuantity());
    };

    syncCartQuantity();
    window.addEventListener(CART_UPDATED_EVENT, syncCartQuantity);
    window.addEventListener("storage", syncCartQuantity);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, syncCartQuantity);
      window.removeEventListener("storage", syncCartQuantity);
    };
  }, []);

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
    if (!isAccountMenuOpen && !isNotificationsOpen) {
      return;
    }

    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideAccountMenu = accountRef.current?.contains(target);
      const isInsideNotifications = notificationsRef.current?.contains(target);
      const isInsideMobileNotifications = mobileNotificationsRef.current?.contains(
        target,
      );

      if (
        !isInsideAccountMenu &&
        !isInsideNotifications &&
        !isInsideMobileNotifications
      ) {
        setIsAccountMenuOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isAccountMenuOpen, isNotificationsOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    const closeOnDesktopResize = () => {
      if (window.innerWidth > 900) {
        setIsMobileMenuOpen(false);
        setIsNotificationsOpen(false);
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
    setIsNotificationsOpen(false);
  };

  const openMobileMenu = () => {
    setIsVisible(true);
    setIsAccountMenuOpen(false);
    setIsNotificationsOpen(false);
    setIsMobileMenuOpen(true);
  };

  const handleLogout = async () => {
    await logout();
    setIsAccountMenuOpen(false);
    setIsNotificationsOpen(false);
    closeMobileMenu();
    router.replace("/");
  };

  const openNotifications = () => {
    setIsAccountMenuOpen(false);
    setIsNotificationsOpen(true);
  };

  const isActiveNavigationItem = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const sessionLink = user
    ? user.role === "customer"
      ? "/account/orders"
      : getRedirectPathForRole(user.role)
    : "/auth/login";
  const sessionLabel = user
    ? getSessionLinkLabel(user.role)
    : "Sign In or Continue as Guest";

  const sessionPhone = user?.customer?.contact_number ?? "";
  const isCustomerOrdersPath =
    pathname === "/account/orders" || pathname.startsWith("/account/orders/");

  const cartLabel =
    cartQuantity === 1
      ? "Shopping cart, 1 item"
      : "Shopping cart, " + cartQuantity + " items";

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
                aria-current={
                  isActiveNavigationItem(item.href) ? "page" : undefined
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="site-header-actions">
            <Link className="site-header-track" href="/track-order">
              Track Order
            </Link>
            {user?.role === "customer" ? (
              <Link
                className="site-header-track"
                href="/account/orders"
                aria-current={isCustomerOrdersPath ? "page" : undefined}
              >
                My Orders
              </Link>
            ) : null}
            {user?.role === "customer" ? (
              <div className="site-header-notifications" ref={notificationsRef}>
                <button
                  type="button"
                  className="site-header-notifications-trigger"
                  aria-label={
                    isNotificationsOpen
                      ? "Close notifications"
                      : "Open notifications"
                  }
                  aria-expanded={isNotificationsOpen}
                  aria-controls="site-header-notifications-menu"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    setIsNotificationsOpen((open) => !open);
                  }}
                >
                  <FontAwesomeIcon icon={faBell} aria-hidden="true" />
                  {customerNotifications.unreadCount > 0 ? (
                    <span
                      className="site-header-notifications-badge"
                      aria-label={`${customerNotifications.unreadCount} unread notifications`}
                    >
                      {formatNotificationCount(customerNotifications.unreadCount)}
                    </span>
                  ) : null}
                </button>
                {isNotificationsOpen ? (
                  <NotificationDropdown
                    id="site-header-notifications-menu"
                    notifications={customerNotifications.notifications}
                    unreadCount={customerNotifications.unreadCount}
                    isLoading={customerNotifications.isLoading}
                    error={customerNotifications.error}
                    onRefresh={() => void customerNotifications.refresh()}
                    onMarkRead={customerNotifications.markRead}
                    onMarkAllRead={customerNotifications.markAllRead}
                    onClose={() => setIsNotificationsOpen(false)}
                  />
                ) : null}
              </div>
            ) : null}
            <span className="site-header-divider" aria-hidden="true" />
            <Link
              className="site-header-cart"
              href="/cart"
              aria-label={cartLabel}
            >
              <FontAwesomeIcon icon={faCartShopping} aria-hidden="true" />
              {cartQuantity > 0 ? (
                <span className="site-header-cart-badge" aria-hidden="true">
                  {cartQuantity}
                </span>
              ) : null}
            </Link>
            {isAuthLoading ? (
              <span className="site-header-guest" aria-live="polite">
                Checking session…
              </span>
            ) : user ? (
              <div className="site-header-account" ref={accountRef}>
                <button
                  type="button"
                  className="site-header-account-trigger"
                  aria-label={
                    isAccountMenuOpen ? "Close account menu" : "Open account menu"
                  }
                  aria-haspopup="menu"
                  aria-expanded={isAccountMenuOpen}
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    setIsAccountMenuOpen((open) => !open);
                  }}
                >
                  <FontAwesomeIcon icon={faCircleUser} aria-hidden="true" />
                </button>
                {isAccountMenuOpen ? (
                  <div
                    className="site-header-account-menu"
                    role="menu"
                    aria-label="Account menu"
                  >
                    <div className="site-header-account-summary">
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                      {sessionPhone ? <span>{sessionPhone}</span> : null}
                    </div>
                    {user.role === "customer" ? (
                      <>
                        <Link
                          href="/account/orders"
                          className="site-header-account-menu-link"
                          role="menuitem"
                          onClick={() => setIsAccountMenuOpen(false)}
                        >
                          <FontAwesomeIcon
                            icon={faClipboardList}
                            aria-hidden="true"
                          />
                          <span>My Orders</span>
                        </Link>
                        <button
                          type="button"
                          className="site-header-account-menu-link"
                          role="menuitem"
                          onClick={openNotifications}
                        >
                          <FontAwesomeIcon icon={faBell} aria-hidden="true" />
                          <span>Notifications</span>
                        </button>
                        <Link
                          href="/account/profile"
                          className="site-header-account-menu-link"
                          role="menuitem"
                          onClick={() => setIsAccountMenuOpen(false)}
                        >
                          <FontAwesomeIcon icon={faUser} aria-hidden="true" />
                          <span>Profile</span>
                        </Link>
                      </>
                    ) : (
                      <Link
                        href={sessionLink}
                        className="site-header-account-menu-link"
                        role="menuitem"
                        onClick={() => setIsAccountMenuOpen(false)}
                      >
                        {sessionLabel}
                      </Link>
                    )}
                    <button
                      type="button"
                      className="site-header-account-logout"
                      role="menuitem"
                      onClick={handleLogout}
                    >
                      <FontAwesomeIcon
                        icon={faRightFromBracket}
                        aria-hidden="true"
                      />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link className="site-header-guest" href="/auth/login">
                Sign In or Continue as Guest
              </Link>
            )}
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
                  aria-current={
                    isActiveNavigationItem(item.href) ? "page" : undefined
                  }
                  onClick={closeMobileMenu}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="site-mobile-nav-actions">
              <Link
                className="site-mobile-nav-action"
                href="/track-order"
                onClick={closeMobileMenu}
              >
                <FontAwesomeIcon icon={faClipboardList} aria-hidden="true" />
                <span>Track Order</span>
              </Link>
              {user?.role === "customer" ? (
                <Link
                  className="site-mobile-nav-action"
                  href="/account/orders"
                  aria-current={isCustomerOrdersPath ? "page" : undefined}
                  onClick={closeMobileMenu}
                >
                  <FontAwesomeIcon icon={faClipboardList} aria-hidden="true" />
                  <span>My Orders</span>
                </Link>
              ) : null}
              {user?.role === "customer" ? (
                <div
                  className="site-mobile-notifications-container"
                  ref={mobileNotificationsRef}
                >
                  <button
                    type="button"
                    className="site-mobile-nav-action site-mobile-nav-button"
                    aria-expanded={isNotificationsOpen}
                    aria-controls="site-mobile-notifications"
                    onClick={() => {
                      setIsNotificationsOpen((open) => !open);
                    }}
                  >
                    <FontAwesomeIcon icon={faBell} aria-hidden="true" />
                    <span>Notifications</span>
                    {customerNotifications.unreadCount > 0 ? (
                      <span
                        className="site-mobile-nav-cart-badge"
                        aria-label={`${customerNotifications.unreadCount} unread notifications`}
                      >
                        {formatNotificationCount(customerNotifications.unreadCount)}
                      </span>
                    ) : null}
                  </button>
                  {isNotificationsOpen ? (
                    <NotificationDropdown
                      id="site-mobile-notifications"
                      isMobile
                      notifications={customerNotifications.notifications}
                      unreadCount={customerNotifications.unreadCount}
                      isLoading={customerNotifications.isLoading}
                      error={customerNotifications.error}
                      onRefresh={() => void customerNotifications.refresh()}
                      onMarkRead={customerNotifications.markRead}
                      onMarkAllRead={customerNotifications.markAllRead}
                      onClose={() => setIsNotificationsOpen(false)}
                    />
                  ) : null}
                </div>
              ) : null}
              <Link
                className="site-mobile-nav-action"
                href="/cart"
                aria-label={cartLabel}
                onClick={closeMobileMenu}
              >
                <FontAwesomeIcon icon={faCartShopping} aria-hidden="true" />
                <span>Cart</span>
                {cartQuantity > 0 ? (
                  <span className="site-mobile-nav-cart-badge" aria-hidden="true">
                    {cartQuantity}
                  </span>
                ) : null}
              </Link>
              {isAuthLoading ? (
                <span className="site-mobile-nav-action" aria-live="polite">
                  Checking session…
                </span>
              ) : user ? (
                <>
                  {user.role === "customer" ? (
                    <Link
                      className="site-mobile-nav-action"
                      href="/account/profile"
                      onClick={closeMobileMenu}
                    >
                      <FontAwesomeIcon icon={faUser} aria-hidden="true" />
                      <span>Profile</span>
                    </Link>
                  ) : (
                    <Link
                      className="site-mobile-nav-action"
                      href={sessionLink}
                      onClick={closeMobileMenu}
                    >
                      <FontAwesomeIcon icon={faUser} aria-hidden="true" />
                      <span>{sessionLabel}</span>
                    </Link>
                  )}
                  <button
                    type="button"
                    className="site-mobile-nav-action site-mobile-nav-button"
                    onClick={handleLogout}
                  >
                    <FontAwesomeIcon
                      icon={faRightFromBracket}
                      aria-hidden="true"
                    />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  className="site-mobile-nav-action"
                  href="/auth/login"
                  onClick={closeMobileMenu}
                >
                  <FontAwesomeIcon icon={faUser} aria-hidden="true" />
                  <span>Sign In or Continue as Guest</span>
                </Link>
              )}
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
