import { NextRequest } from "next/server";
import { proxyOrderRequest } from "@/lib/orders/orderProxy";

type TrackOrderPaymentProofRouteContext = {
  params: Promise<{ reference: string }>;
};

export async function POST(
  request: NextRequest,
  { params }: TrackOrderPaymentProofRouteContext,
) {
  const { reference } = await params;
  const trackingToken = request.headers.get("x-order-tracking-token");
  const headers = new Headers();

  if (trackingToken) {
    headers.set("X-Order-Tracking-Token", trackingToken);
  }

  return proxyOrderRequest(
    `/order-requests/track/${encodeURIComponent(reference)}/payment-proof`,
    {
      method: "POST",
      headers,
      body: await request.formData(),
    },
  );
}
