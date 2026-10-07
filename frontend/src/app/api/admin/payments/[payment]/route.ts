import { NextRequest } from "next/server";
import { proxyAdminPaymentsRequest } from "@/lib/adminPaymentsProxy";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ payment: string }> },
) {
  const { payment } = await context.params;
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);

  return proxyAdminPaymentsRequest(`/admin/payments/${encodeURIComponent(payment)}`, { headers });
}
