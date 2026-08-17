import type { ReactNode } from "react";
import "../styles/auth.css";

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <main>{children}</main>;
}
