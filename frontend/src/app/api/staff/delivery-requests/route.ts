import { NextRequest } from "next/server";
import { proxyDeliveryRequest } from "@/lib/staffDeliveryProxy";

const allowedQueryParameters = [
  "search",
  "status",
  "page",
  "per_page",
] as const;

export async function GET(request: NextRequest) {
  const query = new URLSearchParams();

  for (const parameter of allowedQueryParameters) {
    const value = request.nextUrl.searchParams.get(parameter);

    if (value) {
      query.set(parameter, value);
    }
  }

  const authorization = request.headers.get("authorization");
  const headers = new Headers();

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  const queryString = query.toString();

  return proxyDeliveryRequest(
    `/staff/delivery-requests${queryString ? `?${queryString}` : ""}`,
    { headers },
  );
}
