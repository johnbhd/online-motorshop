import { NextRequest } from "next/server";
import { proxyPickupRequest } from "@/lib/staffPickupProxy";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ pickup: string }> },
) {
  const { pickup } = await context.params;
  const authorization = request.headers.get("authorization");
  const headers = new Headers();

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  return proxyPickupRequest(
    `/staff/pickup-requests/${encodeURIComponent(pickup)}`,
    { headers },
  );
}
