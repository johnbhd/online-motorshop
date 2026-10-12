import { NextRequest } from "next/server";
import { proxyOrderRequest } from "@/lib/orders/orderProxy";

type TrackOrderAuthorizationRouteContext = {
  params: Promise<{ reference: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: TrackOrderAuthorizationRouteContext,
) {
  const { reference } = await params;
  const trackingToken = request.headers.get("x-order-tracking-token");
  const headers = new Headers();

  if (trackingToken) {
    headers.set("X-Order-Tracking-Token", trackingToken);
  }

  return proxyOrderRequest(
    `/order-requests/track/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers,
    },
  );
}
