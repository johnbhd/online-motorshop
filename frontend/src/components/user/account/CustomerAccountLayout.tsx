"use client";

import RoleGuard from "@/components/auth/RoleGuard";

export default function CustomerAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRole="customer">
      <div className="customer-account-layout">{children}</div>
    </RoleGuard>
  );
}
