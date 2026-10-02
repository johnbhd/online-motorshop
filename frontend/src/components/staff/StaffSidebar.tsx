"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faChartColumn,
  faClipboardList,
  faComments,
  faCreditCard,
  faGaugeHigh,
  faStar,
  faStore,
  faTruck,
  faUser,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  getStaffSidebarCounts,
  type StaffSidebarCounts,
} from "./staffSidebarApi";

const icons = {
  Dashboard: faGaugeHigh,
  Orders: faClipboardList,
  Payments: faCreditCard,
  "Pickup Requests": faStore,
  "Delivery Requests": faTruck,
  Products: faBoxOpen,
  Messages: faComments,
  Customers: faUsers,
  Reviews: faStar,
  Reports: faChartColumn,
  Profile: faUser,
} as const;

type SidebarLink = {
  label: keyof typeof icons;
  href: string;
  badgeKey?: keyof StaffSidebarCounts;
};

const links: SidebarLink[] = [
  { label: "Dashboard", href: "/staff" },
  { label: "Orders", href: "/staff/orders", badgeKey: "orders" },
  { label: "Payments", href: "/staff/payments", badgeKey: "payments" },
  {
    label: "Pickup Requests",
    href: "/staff/pickup-requests",
    badgeKey: "pickup_requests",
  },
  {
    label: "Delivery Requests",
    href: "/staff/delivery-requests",
    badgeKey: "delivery_requests",
  },
  { label: "Products", href: "/staff/products" },
  { label: "Messages", href: "/staff/messages" },
  { label: "Customers", href: "/staff/customers" },
  { label: "Reviews", href: "/staff/reviews" },
  { label: "Reports", href: "/staff/reports" },
  { label: "Profile", href: "#" },
];

function formatSidebarBadge(value: number) {
  return value > 9 ? "9+" : value;
}

export default function StaffSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const path = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [counts, setCounts] = useState<StaffSidebarCounts | null>(null);

  const refreshCounts = useCallback(
    async (signal?: AbortSignal) => {
      const token = getAuthToken();

      if (!token || user?.role !== "staff") {
        setCounts(null);
        return;
      }

      try {
        setCounts(await getStaffSidebarCounts(token, signal));
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setCounts(null);
      }
    },
    [user?.role],
  );

  useEffect(() => {
    const controller = new AbortController();
    const refresh = () => void refreshCounts();

    const initialRefresh = window.setTimeout(
      () => void refreshCounts(controller.signal),
      0,
    );
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    window.addEventListener("staff-data-updated", refresh);

    return () => {
      controller.abort();
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("staff-data-updated", refresh);
    };
  }, [path, refreshCounts]);

  const handleLogout = async () => {
    await logout();
    onClose();
    router.replace("/");
  };

  return (
    <>
      <button
        aria-label="Close staff navigation"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-950/60 lg:hidden ${open ? "block" : "hidden"}`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-y-auto border-r border-white/10 bg-[#0B1930] text-slate-200 shadow-2xl transition-transform duration-300 lg:translate-x-0 lg:shadow-none ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="relative border-b border-white/10 px-6 pb-6 pt-7">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-lg text-xl hover:bg-white/10 lg:hidden"
            aria-label="Close staff navigation"
          >
            ×
          </button>
          <Link
            href="/staff"
            onClick={onClose}
            className="flex flex-col items-center text-center"
          >
            <Image
              src="/branding/logo.png"
              width={80}
              height={80}
              className="size-20 rounded-full object-cover shadow-lg"
              alt="ALD Motorshop logo"
            />
            <span className="mt-3 text-lg font-bold text-white">
              ALD Motorshop
            </span>
            <span className="mt-.5 text-xs font-medium uppercase tracking-[.22em] text-slate-400">
              Staff Portal
            </span>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-5" aria-label="Staff navigation">
          <ul className="space-y-1">
            {links.map(({ label, href, badgeKey }) => {
              const active =
                href !== "#" &&
                (path === href ||
                  (href !== "/staff" && path.startsWith(`${href}/`)));
              const badge = badgeKey ? counts?.[badgeKey] : undefined;
              return (
                <li key={label}>
                  <Link
                    href={href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={`group flex min-h-11 items-center gap-3 rounded-r-lg border-l-4 px-3 py-2.5 text-sm font-medium transition ${active ? "border-orange-500 bg-[#152B4B] text-white" : "border-transparent text-slate-300 hover:bg-white/[.06] hover:text-white"}`}
                  >
                    <span
                      className={
                        active
                          ? "text-orange-400"
                          : "text-slate-400 group-hover:text-orange-400"
                      }
                    >
                      <FontAwesomeIcon icon={icons[label]} className="w-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    {badge !== undefined && badge > 0 && (
                      <span className="grid size-5 place-items-center rounded-full bg-orange-500 text-[11px] font-bold text-white">
                        {formatSidebarBadge(badge)}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-11 w-full items-center gap-3 rounded-lg border-l-4 border-transparent px-3 py-2.5 text-left text-sm font-medium text-slate-300 hover:bg-white/[.06] hover:text-white"
          >
            <span>↪</span>Logout
          </button>
        </div>
      </aside>
    </>
  );
}
