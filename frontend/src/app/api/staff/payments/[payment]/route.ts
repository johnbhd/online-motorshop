import { NextRequest } from "next/server";
import { proxyPaymentRequest } from "@/lib/staffPaymentProxy";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ payment: string }> },
) {
  const { payment } = await context.params;
  const authorization = request.headers.get("authorization");
  const headers = new Headers();

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  return proxyPaymentRequest(
    `/staff/payments/${encodeURIComponent(payment)}`,
    { headers },
  );
}
