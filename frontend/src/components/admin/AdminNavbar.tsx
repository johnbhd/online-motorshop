"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faBell,
  faChevronDown,
  faCircleUser,
  faMagnifyingGlass,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePortalNotifications } from "@/components/portal/notifications/usePortalNotifications";

const labels: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/orders": "Orders",
  "/admin/payments": "Payments",
  "/admin/pickup-requests": "Pickup Requests",
  "/admin/delivery-requests": "Delivery Requests",
  "/admin/products": "Products",
  "/admin/customers": "Customers",
  "/admin/messages": "Messages",
  "/admin/notifications": "Notifications",
  "/admin/branches": "Branches",
  "/admin/staff-management": "Staff Management",
  "/admin/website-content": "Website Content",
  "/admin/settings": "Settings",
  "/admin/profile": "My Profile",
};

export default function AdminNavbar({
  onMenu,
  open,
}: {
  onMenu: () => void;
  open: boolean;
}) {
  const [menu, setMenu] = useState<"notifications" | "profile" | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const path = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const { notifications, unreadCount, loading, markRead } = usePortalNotifications("admin", { perPage: 5 });
  const title = labels[path] ?? "Dashboard";

  useEffect(() => {
    const click = (e: MouseEvent) =>
      !ref.current?.contains(e.target as Node) && setMenu(null);
    const escape = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    document.addEventListener("mousedown", click);
    window.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", click);
      window.removeEventListener("keydown", escape);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setMenu(null);
    router.replace("/");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onMenu}
            aria-expanded={open}
            aria-controls="admin-sidebar"
            className="grid size-10 place-items-center rounded-lg text-xl text-[#0B1930] hover:bg-slate-100 lg:hidden"
            aria-label="Open admin navigation"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
          <div className="min-w-0">
            <p className="hidden truncate text-sm font-medium text-slate-500 sm:block">
              Admin Portal <span className="mx-1 text-slate-300">/</span>
              {title}
            </p>
            <h1 className="truncate text-lg font-semibold text-[#0B1930] sm:mt-.5 sm:text-xl">
              {title}
            </h1>
          </div>
        </div>
        <div ref={ref} className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            className="hidden size-9 place-items-center text-lg text-[#0B1930] hover:text-orange-500 sm:grid"
            aria-label="Search"
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </button>
          <div className="relative">
            <button
              onClick={() =>
                setMenu(menu === "notifications" ? null : "notifications")
              }
              className="relative grid size-10 place-items-center text-xl text-[#0B1930] hover:text-orange-500"
              aria-haspopup="menu"
              aria-expanded={menu === "notifications"}
              aria-label={`Notifications, ${unreadCount} unread`}
            >
              <FontAwesomeIcon icon={faBell} />
              {unreadCount > 0 && <span className="absolute right-0 top-0 grid min-w-3.5 place-items-center rounded-full bg-orange-500 px-1 text-[8px] font-bold text-white ring-2 ring-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
            </button>
            {menu === "notifications" && (
              <div className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-1rem)] max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:w-80">
                <h2 className="border-b border-slate-100 px-4 py-3.5 text-sm font-bold text-[#0B1930]">
                  Notifications
                </h2>
                {loading && <p className="px-4 py-5 text-sm text-slate-500">Loading notifications…</p>}
                {!loading && !notifications.length && <p className="px-4 py-5 text-sm text-slate-500">You&apos;re all caught up.</p>}
                {!loading && notifications.slice(0, 5).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => { void markRead(n); setMenu(null); }}
                    className={`flex w-full gap-3 border-b border-slate-100 px-4 py-3.5 text-left hover:bg-slate-50 ${!n.read ? "bg-orange-50/60" : "bg-white"}`}
                  >
                    <span className="grid size-9 place-items-center rounded-lg bg-orange-100 text-orange-600">
                      ●
                    </span>
                    <span className="min-w-0">
                      <span className="flex gap-2">
                        <i
                          className={
                            !n.read
                              ? "mt-1 size-1.5 rounded-full bg-orange-500"
                              : "hidden"
                          }
                        />
                        <b className="truncate text-sm text-[#0B1930]">
                          {n.title}
                        </b>
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        {n.message}
                      </span>
                      <span className="mt-1 block text-xs text-slate-400">
                        {n.created_at ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(n.created_at)) : "Time unavailable"}
                      </span>
                    </span>
                  </button>
                ))}
                <Link href="/admin/notifications" onClick={() => setMenu(null)} className="block border-t border-slate-100 px-4 py-3 text-center text-sm font-semibold text-orange-600">See All Notifications</Link>
              </div>
            )}
          </div>
          <span className="mx-2 hidden h-8 w-px bg-slate-200 sm:block" />
          <div className="relative">
            <button
              onClick={() => setMenu(menu === "profile" ? null : "profile")}
              aria-haspopup="menu"
              aria-expanded={menu === "profile"}
              className="flex items-center gap-3 rounded-xl p-1.5 text-left hover:bg-slate-100"
            >
              <span className="grid size-9 place-items-center rounded-full bg-slate-100 text-slate-500 ring-1 ring-slate-200">
                <FontAwesomeIcon icon={faCircleUser} />
              </span>
              <span className="hidden sm:block">
                <b className="block max-w-40 truncate text-sm text-[#0B1930]">
                  {user?.name ?? "Admin User"}
                </b>
                <small className="block text-xs text-slate-500">
                  Administrator
                </small>
              </span>
              <i className="hidden text-xs sm:block">
                <FontAwesomeIcon icon={faChevronDown} />
              </i>
            </button>
            {menu === "profile" && (
              <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
                <Link
                  href="/admin/profile"
                  onClick={() => setMenu(null)}
                  className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  ◉ &nbsp; Profile
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full border-t border-slate-100 px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <FontAwesomeIcon icon={faRightFromBracket} />
                  &nbsp; Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
