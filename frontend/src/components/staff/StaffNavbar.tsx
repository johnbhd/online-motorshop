"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faBell,
  faChevronDown,
  faCircleUser,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePortalNotifications } from "@/components/portal/notifications/usePortalNotifications";

export default function StaffNavbar({ onMenu }: { onMenu: () => void }) {
  const [menu, setMenu] = useState<"notifications" | "profile" | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { logout, user } = useAuth();
  const { notifications, unreadCount, loading, markRead } = usePortalNotifications("staff", { perPage: 5 });

  useEffect(() => {
    const close = (e: MouseEvent) =>
      !ref.current?.contains(e.target as Node) && setMenu(null);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleLogout = async () => {
    await logout();
    setMenu(null);
    router.replace("/");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="flex min-h-18 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenu}
            className="grid size-10 place-items-center rounded-lg text-xl hover:bg-slate-100 lg:hidden"
            aria-label="Open staff navigation"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-orange-600">
              ALD Motorshop
            </p>
            <p className="text-sm font-bold text-[#0B1930]">Staff Portal</p>
          </div>
        </div>
        <div ref={ref} className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() =>
                setMenu(menu === "notifications" ? null : "notifications")
              }
              className="relative grid size-10 place-items-center rounded-lg text-lg text-slate-600 hover:bg-slate-100"
              aria-label={`Notifications, ${unreadCount} unread`}
            >
              <FontAwesomeIcon icon={faBell} aria-hidden="true" />
              {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
            </button>
            {menu === "notifications" && (
              <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                <p className="px-4 py-3 text-sm font-bold text-[#0B1930]">
                  Notifications
                </p>
                {loading && <p className="px-4 py-5 text-sm text-slate-500">Loading notifications…</p>}
                {!loading && !notifications.length && <p className="px-4 py-5 text-sm text-slate-500">You&apos;re all caught up.</p>}
                {!loading && notifications.slice(0, 4).map((n) => (
                  <button
                    key={n.id}
                    className="block w-full px-4 py-3 text-left hover:bg-slate-50"
                    onClick={() => { void markRead(n); setMenu(null); }}
                  >
                    <p className="text-sm font-semibold text-slate-700">
                      {!n.read && (
                        <span className="mr-2 inline-block size-2 rounded-full bg-orange-500" />
                      )}
                      {n.title}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {n.message}
                    </p>
                  </button>
                ))}
                <Link
                  href="/staff/notifications"
                  className="block border-t border-slate-100 px-4 py-3 text-center text-sm font-semibold text-orange-600"
                  onClick={() => setMenu(null)}
                >
                  See All Notifications
                </Link>
              </div>
            )}
          </div>
          <span className="mx-2 hidden h-8 w-px bg-slate-200 sm:block" />
          <div className="relative">
            <button
              onClick={() => setMenu(menu === "profile" ? null : "profile")}
              className="flex items-center gap-3 rounded-xl p-1.5 text-left hover:bg-slate-100"
              aria-haspopup="menu"
              aria-expanded={menu === "profile"}
            >
              <span className="grid size-9 place-items-center rounded-full bg-slate-100 text-slate-500">
                <FontAwesomeIcon icon={faCircleUser} aria-hidden="true" />
              </span>
              <span className="hidden sm:block">
                <span className="block max-w-40 truncate text-sm font-semibold text-[#0B1930]">
                  {user?.name ?? "Staff User"}
                </span>
                <span className="block text-xs text-slate-500">Staff</span>
              </span>
              <span className="hidden text-xs sm:block">
                <FontAwesomeIcon icon={faChevronDown} />
              </span>
            </button>
            {menu === "profile" && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
                <Link
                  href="/staff/profile"
                  className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => setMenu(null)}
                >
                  <FontAwesomeIcon icon={faCircleUser} aria-hidden="true" />{" "}
                  &nbsp; Profile
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full border-t border-slate-100 px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <FontAwesomeIcon icon={faRightFromBracket} aria-hidden="true" />{" "}
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
