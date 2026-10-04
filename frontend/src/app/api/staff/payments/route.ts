import { NextRequest } from "next/server";
import { proxyPaymentRequest } from "@/lib/staffPaymentProxy";

const allowedQueryParameters = [
  "search",
  "status",
  "method",
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

  return proxyPaymentRequest(
    `/staff/payments${queryString ? `?${queryString}` : ""}`,
    { headers },
  );
}
