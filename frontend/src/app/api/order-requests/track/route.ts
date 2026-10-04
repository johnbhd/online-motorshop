import { NextRequest } from "next/server";
import { proxyOrderRequest } from "@/lib/orders/orderProxy";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const contentType = request.headers.get("content-type");
  const headers = new Headers();

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  return proxyOrderRequest("/order-requests/track", {
    method: "POST",
    headers,
    body,
  });
}
