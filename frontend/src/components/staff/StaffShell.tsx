"use client";
import { useEffect, useState } from "react";
import StaffSidebar from "./StaffSidebar";
import StaffNavbar from "./StaffNavbar";
export default function StaffShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const close = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  return (
    <div className="min-h-screen bg-slate-50">
      <StaffSidebar open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-72">
        <StaffNavbar onMenu={() => setOpen(true)} />
        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
