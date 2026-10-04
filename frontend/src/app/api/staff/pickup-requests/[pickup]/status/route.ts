import { NextRequest } from "next/server";
import { proxyPickupRequest } from "@/lib/staffPickupProxy";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ pickup: string }> },
) {
  const { pickup } = await context.params;
  const authorization = request.headers.get("authorization");
  const headers = new Headers();

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  headers.set("Content-Type", "application/json");

  return proxyPickupRequest(
    `/staff/pickup-requests/${encodeURIComponent(pickup)}/status`,
    {
      method: "PATCH",
      headers,
      body: await request.text(),
    },
  );
}
