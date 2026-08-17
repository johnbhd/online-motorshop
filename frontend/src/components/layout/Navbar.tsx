import Link from "next/link";

const navigationItems = [
  { href: "/auth/login", label: "Login" },
  { href: "/about", label: "About" },
  { href: "/staff", label: "Staff" },
  { href: "/admin", label: "Admin" },
];

export function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <Link href="/" className="text-lg font-bold text-slate-950">
          ALD <span className="text-amber-500">Motorshop</span>
        </Link>

        <div className="flex gap-3">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
