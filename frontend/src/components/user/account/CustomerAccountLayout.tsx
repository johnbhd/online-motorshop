"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboardList } from "@fortawesome/free-solid-svg-icons";
import DemoRoleGuard from "@/components/auth/DemoRoleGuard";

export default function CustomerAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isOrdersActive =
    pathname === "/account/orders" ||
    Boolean(pathname?.startsWith("/account/orders/"));

  return (
    <DemoRoleGuard allowedRole="customer">
      <div className="customer-account-layout">
        <nav
          className="customer-account-nav"
          aria-label="Customer account navigation"
        >
          <div className="customer-account-shell customer-account-nav-inner">
            <span className="customer-account-nav-label">My Account</span>
            <Link
              className={
                isOrdersActive
                  ? "customer-account-nav-link is-active"
                  : "customer-account-nav-link"
              }
              href="/account/orders"
              aria-current={isOrdersActive ? "page" : undefined}
            >
              <FontAwesomeIcon icon={faClipboardList} aria-hidden="true" />
              <span>My Orders</span>
            </Link>
          </div>
        </nav>
        {children}
      </div>
    </DemoRoleGuard>
  );
}
