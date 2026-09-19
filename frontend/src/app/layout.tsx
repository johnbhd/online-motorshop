import type { Metadata } from "next";
import "./globals.css";
import { DemoAuthProvider } from "@/components/auth/DemoAuthProvider";

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
        <DemoAuthProvider>{children}</DemoAuthProvider>
      </body>
    </html>
  );
}
