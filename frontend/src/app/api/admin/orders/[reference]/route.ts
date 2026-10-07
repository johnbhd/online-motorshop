import { NextRequest } from "next/server";
import { proxyAdminOrdersRequest } from "@/lib/adminOrdersProxy";

export async function GET(request: NextRequest, context: { params: Promise<{ reference: string }> }) {
  const { reference } = await context.params;
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);
  return proxyAdminOrdersRequest(`/admin/orders/${encodeURIComponent(reference)}`, { headers });
}
