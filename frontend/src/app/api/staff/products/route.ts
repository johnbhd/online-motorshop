import { NextRequest } from "next/server";
import { proxyStaffProductsRequest } from "@/lib/staffProductsProxy";

const allowedQueryParameters = [
  "search",
  "brand",
  "category",
  "status",
  "availability_status",
  "sort",
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

  const headers = new Headers();
  const authorization = request.headers.get("authorization");

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  const queryString = query.toString();

  return proxyStaffProductsRequest(
    `/staff/products${queryString ? `?${queryString}` : ""}`,
    { headers },
  );
}
