import type { ReactNode } from "react";
import "../styles/about/about.css";
import "../styles/about/about2.css";
import "../styles/contact/contact.css";
import "../styles/contact/contact2.css";
import "../styles/footer.css";
import "../styles/header.css";
import "../styles/home/home.css";
import "../styles/home/home2.css";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export default function SiteLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased">
      <Navbar />
        <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
