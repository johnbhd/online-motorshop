import { NextRequest } from "next/server";
import { proxyAdminPaymentsRequest } from "@/lib/adminPaymentsProxy";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ payment: string }> },
) {
  const { payment } = await context.params;
  const headers = new Headers({ "Content-Type": "application/json" });
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);

  return proxyAdminPaymentsRequest(`/admin/payments/${encodeURIComponent(payment)}/status`, {
    method: "PATCH",
    headers,
    body: await request.text(),
  });
}
