import { NextRequest } from "next/server";
import { proxyDeliveryRequest } from "@/lib/staffDeliveryProxy";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ delivery: string }> },
) {
  const { delivery } = await context.params;
  const authorization = request.headers.get("authorization");
  const headers = new Headers();

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  headers.set("Content-Type", "application/json");

  return proxyDeliveryRequest(
    `/staff/delivery-requests/${encodeURIComponent(delivery)}/status`,
    {
      method: "PATCH",
      headers,
      body: await request.text(),
    },
  );
}
