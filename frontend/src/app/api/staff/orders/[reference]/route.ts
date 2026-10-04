import { NextRequest } from "next/server";
import { proxyOrderRequest } from "@/lib/orders/orderProxy";

type StaffOrderRouteContext = {
  params: Promise<{ reference: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: StaffOrderRouteContext,
) {
  const { reference } = await params;
  const authorization = request.headers.get("authorization");
  const headers = new Headers();

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  return proxyOrderRequest(
    `/staff/orders/${encodeURIComponent(reference)}`,
    { headers },
  );
}
