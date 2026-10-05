import type { Metadata } from "next";
import "./globals.css";
import "./styles/toast.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ToastProvider } from "@/components/ui/toast/ToastProvider";

export const metadata: Metadata = {
  title: "ALD Motorshop",
  description:
    "Web-Based Motorcycle Parts Ordering and Delivery Request Management System for ALD Motorshop",
  icons: {
    icon: "/branding/logo.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
