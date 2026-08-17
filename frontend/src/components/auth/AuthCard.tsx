import type { ReactNode } from "react";
import Image from "next/image";

type AuthCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="auth-page">
      <div className="auth-panel">
        <section className="auth-card">
          <div className="auth-image">
            <Image src="/images/hero-section.jpg" alt="Motorcycle parts" className="auth-hero-image" fill sizes="(max-width: 900px) 0px, 55vw" />
          </div>

          <div className="auth-content">
            <Image src="/branding/logo.png" alt="ALD Motorshop logo" className="auth-logo" width={112} height={112} />
            <h1>{title}</h1>
            <p className="auth-subtitle">{subtitle}</p>
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
