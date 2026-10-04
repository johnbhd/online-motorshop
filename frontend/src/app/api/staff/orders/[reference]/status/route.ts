import { NextRequest } from "next/server";
import { proxyOrderRequest } from "@/lib/orders/orderProxy";

type StaffOrderStatusRouteContext = {
  params: Promise<{ reference: string }>;
};

export async function PATCH(
  request: NextRequest,
  { params }: StaffOrderStatusRouteContext,
) {
  const { reference } = await params;
  const authorization = request.headers.get("authorization");
  const headers = new Headers();

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  headers.set("Content-Type", "application/json");

  return proxyOrderRequest(
    `/staff/orders/${encodeURIComponent(reference)}/status`,
    {
      method: "PATCH",
      headers,
      body: await request.text(),
    },
  );
}
