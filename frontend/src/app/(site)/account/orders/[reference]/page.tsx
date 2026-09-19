import type { Metadata } from "next";
import CustomerOrderDetailsPage from "@/components/user/account/order-details/CustomerOrderDetailsPage";

type CustomerOrderDetailsRouteProps = {
  params: Promise<{
    reference: string;
  }>;
};

export const metadata: Metadata = {
  title: "Order Details | ALD Motorshop",
  description: "Review the details of an ALD Motorshop order request.",
  robots: {
    index: false,
    follow: true,
  },
};

export default async function CustomerOrderDetailsRoute({
  params,
}: CustomerOrderDetailsRouteProps) {
  const { reference } = await params;

  return <CustomerOrderDetailsPage reference={reference} />;
}
