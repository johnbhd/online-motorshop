import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
