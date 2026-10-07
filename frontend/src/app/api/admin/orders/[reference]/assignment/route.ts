import { NextRequest } from "next/server";
import { proxyAdminOrdersRequest } from "@/lib/adminOrdersProxy";

export async function PATCH(request: NextRequest, context: { params: Promise<{ reference: string }> }) {
  const { reference } = await context.params;
  const headers = new Headers({ "Content-Type": "application/json" });
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);
  return proxyAdminOrdersRequest(`/admin/orders/${encodeURIComponent(reference)}/assignment`, { method: "PATCH", headers, body: await request.text() });
}
