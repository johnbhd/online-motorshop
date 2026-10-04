"use client";

import Image from "next/image";
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
        className="grid min-h-screen place-items-center bg-slate-100 px-6 text-center text-[0px] leading-none text-transparent"
        role="status"
        aria-label="Checking your session"
        aria-live="polite"
      >
        <div className="flex flex-col items-center">
          <Image
            src="/branding/logo.png"
            alt="ALD Motorshop logo"
            width={104}
            height={104}
            priority
            className="size-24 object-contain sm:size-28"
          />
          <p className="mt-5 text-sm font-semibold text-[#0B1930]">
            Checking your session
          </p>
          <span
            className="mt-3 inline-flex items-center gap-1.5"
            aria-hidden="true"
          >
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="motion-safe:animate-bounce size-2 rounded-full bg-orange-500"
                style={{ animationDelay: `${dot * 150}ms` }}
              />
            ))}
          </span>
          <span className="sr-only">
            Please wait while we verify your session.
          </span>
        </div>
        Checking your session…
      </div>
    );
  }

  return <>{children}</>;
}
