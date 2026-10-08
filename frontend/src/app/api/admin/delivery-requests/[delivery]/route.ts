import { NextRequest } from "next/server";
import { proxyAdminDeliveryRequestsRequest } from "@/lib/adminDeliveryRequestsProxy";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ delivery: string }> },
) {
  const { delivery } = await context.params;
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);

  return proxyAdminDeliveryRequestsRequest(
    `/admin/delivery-requests/${encodeURIComponent(delivery)}`,
    { headers },
  );
}
