import type { Metadata } from "next";
import OrderConfirmationPage from "@/components/user/checkout/OrderConfirmationPage";

type OrderConfirmationRouteProps = {
  params: Promise<{
    reference: string;
  }>;
};

export const metadata: Metadata = {
  title: "Order Confirmation | ALD Motorshop",
  description: "Review your saved ALD Motorshop order request reference.",
  robots: {
    index: false,
    follow: true,
  },
};

export default async function OrderConfirmationRoute({
  params,
}: OrderConfirmationRouteProps) {
  const { reference } = await params;

  return <OrderConfirmationPage reference={reference} />;
}
