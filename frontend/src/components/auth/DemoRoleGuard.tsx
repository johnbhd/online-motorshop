"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useDemoAuth } from "./DemoAuthProvider";
import type { DemoUserRole } from "@/lib/auth/demoAuthTypes";

export default function DemoRoleGuard({
  allowedRole,
  children,
}: {
  allowedRole: DemoUserRole;
  children: ReactNode;
}) {
  const router = useRouter();
  const { isReady, session } = useDemoAuth();

  useEffect(() => {
    if (!isReady || session?.role === allowedRole) {
      return;
    }

    if (session?.role === "admin") {
      router.replace("/admin");
      return;
    }

    if (session?.role === "staff") {
      router.replace("/staff");
      return;
    }

    router.replace("/auth/login");
  }, [allowedRole, isReady, router, session?.role]);

  if (!isReady || session?.role !== allowedRole) {
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
