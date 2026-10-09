import { NextRequest } from "next/server";
import { proxyOrderRequest } from "@/lib/orders/orderProxy";

type CustomerPaymentProofRouteContext = {
  params: Promise<{ reference: string }>;
};

export async function POST(
  request: NextRequest,
  { params }: CustomerPaymentProofRouteContext,
) {
  const { reference } = await params;
  const authorization = request.headers.get("authorization");
  const headers = new Headers();

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  return proxyOrderRequest(
    `/customer/orders/${encodeURIComponent(reference)}/payment-proof`,
    {
      method: "POST",
      headers,
      body: await request.formData(),
    },
  );
}
