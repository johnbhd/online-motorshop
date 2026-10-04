import { NextRequest } from "next/server";
import { proxyStaffProductsRequest } from "@/lib/staffProductsProxy";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ partNumber: string }> },
) {
  const { partNumber } = await context.params;
  const headers = new Headers();
  const authorization = request.headers.get("authorization");

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  return proxyStaffProductsRequest(
    `/staff/products/${encodeURIComponent(partNumber)}`,
    { headers },
  );
}
