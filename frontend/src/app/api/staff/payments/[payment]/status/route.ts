import { NextRequest } from "next/server";
import { proxyPaymentRequest } from "@/lib/staffPaymentProxy";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ payment: string }> },
) {
  const { payment } = await context.params;
  const authorization = request.headers.get("authorization");
  const headers = new Headers();

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  headers.set("Content-Type", "application/json");

  return proxyPaymentRequest(
    `/staff/payments/${encodeURIComponent(payment)}/status`,
    {
      method: "PATCH",
      headers,
      body: await request.text(),
    },
  );
}
