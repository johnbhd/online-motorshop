import type { Metadata } from "next";

import CartPage from "@/components/user/cart/CartPage";

export const metadata: Metadata = {
  title: "Shopping Cart | ALD Motorshop",
  description:
    "Review selected motorcycle parts before submitting an order request.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function CartRoute() {
  return <CartPage />;
}
