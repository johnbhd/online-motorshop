import { NextRequest } from "next/server";
import { proxyAdminPickupRequestsRequest } from "@/lib/adminPickupRequestsProxy";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ pickup: string }> },
) {
  const { pickup } = await context.params;
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);

  return proxyAdminPickupRequestsRequest(
    `/admin/pickup-requests/${encodeURIComponent(pickup)}`,
    { headers },
  );
}
