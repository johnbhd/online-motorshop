"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { notifications } from "@/lib/mock/staff";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faBell, faChevronDown, faCircleUser, faMagnifyingGlass, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
export default function StaffNavbar({ onMenu }: { onMenu: () => void }) {
  const [menu, setMenu] = useState<"notifications" | "profile" | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) =>
      !ref.current?.contains(e.target as Node) && setMenu(null);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const unread = notifications.filter((n) => n.unread).length;
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="flex min-h-18 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenu}
            className="grid size-10 place-items-center rounded-lg text-xl hover:bg-slate-100 lg:hidden"
            aria-label="Open staff navigation"
          >
            ☰
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
              aria-label="Notifications"
            >
              <FontAwesomeIcon icon={faBell} aria-hidden="true" />
              </button>
            {menu === "notifications" && (
              <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                <p className="px-4 py-3 text-sm font-bold text-[#0B1930]">
                  Notifications
                </p>
                {notifications.slice(0, 4).map((n) => (
                  <button
                    key={n.id}
                    className="block w-full px-4 py-3 text-left hover:bg-slate-50"
                    onClick={() => setMenu(null)}
                  >
                    <p className="text-sm font-semibold text-slate-700">
                      {n.unread && (
                        <span className="mr-2 inline-block size-2 rounded-full bg-orange-500" />
                      )}
                      {n.title}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {n.description}
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
            >
              <span className="grid size-9 place-items-center rounded-full bg-slate-100 text-slate-500"><FontAwesomeIcon icon={faCircleUser} aria-hidden="true" />
              </span>
              <span className="hidden sm:block">
                <span className="block text-sm font-semibold text-[#0B1930]">
                  Staff User
                </span>
                <span className="block text-xs text-slate-500">Staff</span>
              </span>
              <span className="hidden text-xs sm:block"><FontAwesomeIcon icon={faChevronDown} /></span>
            </button>
            {menu === "profile" && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
                <a
                  href="#"
                  className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                ><FontAwesomeIcon icon={faCircleUser} aria-hidden="true" /> &nbsp; Profile</a>
                <Link
                  href="/"
                  className="block border-t border-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                ><FontAwesomeIcon icon={faRightFromBracket} aria-hidden="true" /> &nbsp; Logout</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
