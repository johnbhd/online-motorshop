import type { ReactNode } from "react";
import "../styles/about/about.css";
import "../styles/about/about2.css";
import "../styles/about/about-modal.css";
import "../styles/contact/contact.css";
import "../styles/contact/contact2.css";
import "../styles/cart/cart.css";
import "../styles/chatbot/chatbot.css";
import "../styles/footer.css";
import "../styles/header.css";
import "../styles/home/home.css";
import "../styles/home/home2.css";
import "../styles/product-details/product-details.css";
import "../styles/products/products.css";

import ChatbotWidget from "@/components/user/chatbot/ChatbotWidget";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export default function SiteLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased">
      <Navbar />
        <main className="flex-1">{children}</main>
      <Footer />
      <ChatbotWidget />
    </div>
  );
}
