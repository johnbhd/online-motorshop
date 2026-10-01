"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import type { AuthUserRole } from "@/lib/auth/authTypes";

export default function RoleGuard({
  allowedRole,
  children,
}: {
  allowedRole: AuthUserRole;
  children: ReactNode;
}) {
  const router = useRouter();
  const { isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading || user?.role === allowedRole) {
      return;
    }

    if (user?.role === "admin") {
      router.replace("/admin");
      return;
    }

    if (user?.role === "staff") {
      router.replace("/staff");
      return;
    }

    router.replace("/auth/login");
  }, [allowedRole, isLoading, router, user?.role]);

  if (isLoading || user?.role !== allowedRole) {
    return (
      <div
        className="grid min-h-screen place-items-center bg-slate-100 px-6 text-center text-sm text-slate-600"
        aria-live="polite"
      >
        Checking your session…
      </div>
    );
  }

  return <>{children}</>;
}
