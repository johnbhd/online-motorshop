import type { Metadata } from "next";
import CheckoutPage from "@/components/user/checkout/CheckoutPage";

export const metadata: Metadata = {
  title: "Checkout | ALD Motorshop",
  description: "Submit a motorcycle parts order request for ALD Motorshop staff review.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function CheckoutRoute() {
  return <CheckoutPage />;
}
