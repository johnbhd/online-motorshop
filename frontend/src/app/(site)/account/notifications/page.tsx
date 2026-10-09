import type { Metadata } from "next";
import NotificationsPage from "@/components/user/account/notifications/NotificationsPage";

export const metadata: Metadata = {
  title: "Notifications | ALD Motorshop",
  description: "Review your ALD Motorshop order, payment, and support notifications.",
  robots: { index: false, follow: true },
};

export default function CustomerNotificationsRoute() {
  return <NotificationsPage />;
}
