import type { ReactNode } from "react";
import CustomerAccountLayout from "@/components/user/account/CustomerAccountLayout";

export default function AccountLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <CustomerAccountLayout>
      {children}
    </CustomerAccountLayout>
  );
}
