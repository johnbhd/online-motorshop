"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
const links = [
  ["Dashboard", "/staff", "▦"],
  ["Orders", "/staff/orders", "▤", 8],
  ["Payments", "/staff/payments", "▣", 3],
  ["Pickup Requests", "/staff/pickup-requests", "⌂", 4],
  ["Delivery Requests", "/staff/delivery-requests", "♞", 2],
  ["Products", "/staff/products", "□"],
  ["Messages", "/staff/messages", "✉", 5],
  ["Customers", "/staff/customers", "♧"],
  ["Reviews", "/staff/reviews", "☆"],
  ["Reports", "/staff/reports", "▥"],
  ["Profile", "#", "◉"],
] as const;
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
export default function StaffSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const path = usePathname();
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
        <nav className="flex-1 px-3 py-5">
          <ul className="space-y-1">
            {links.map(([label, href, , badge]) => {
              const active =
                href !== "#" &&
                (path === href ||
                  (href !== "/staff" && path.startsWith(`${href}/`)));
              return (
                <li key={label}>
                  <Link
                    href={href}
                    onClick={onClose}
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
                    {badge && (
                      <span className="grid size-5 place-items-center rounded-full bg-orange-500 text-[11px] font-bold text-white">
                        {badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-white/10 p-3">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-3 rounded-lg border-l-4 border-transparent px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/[.06] hover:text-white"
          >
            <span>↪</span>Logout
          </Link>
        </div>
      </aside>
    </>
  );
}
