import type { Metadata } from "next";
import MyOrdersPage from "@/components/user/account/orders/MyOrdersPage";

export const metadata: Metadata = {
  title: "My Orders | ALD Motorshop",
  description: "View current and previous ALD Motorshop order requests.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function MyOrdersRoute() {
  return <MyOrdersPage />;
}
