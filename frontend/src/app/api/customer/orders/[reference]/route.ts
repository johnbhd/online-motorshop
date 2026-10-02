import { NextRequest } from "next/server";
import { proxyOrderRequest } from "@/lib/orders/orderProxy";

type CustomerOrderRouteContext = {
  params: Promise<{ reference: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: CustomerOrderRouteContext,
) {
  const { reference } = await params;
  const authorization = request.headers.get("authorization");
  const headers = new Headers();

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  return proxyOrderRequest(
    `/customer/orders/${encodeURIComponent(reference)}`,
    { headers },
  );
}
