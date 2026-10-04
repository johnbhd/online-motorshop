import { NextRequest } from "next/server";
import { proxyDeliveryRequest } from "@/lib/staffDeliveryProxy";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ delivery: string }> },
) {
  const { delivery } = await context.params;
  const authorization = request.headers.get("authorization");
  const headers = new Headers();

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  return proxyDeliveryRequest(
    `/staff/delivery-requests/${encodeURIComponent(delivery)}`,
    { headers },
  );
}
