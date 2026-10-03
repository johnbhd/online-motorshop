import { NextRequest } from "next/server";
import { proxyAdminProductsRequest } from "@/lib/adminProductsProxy";

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

function authorizationHeaders(request: NextRequest) {
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  return headers;
}

export async function GET(request: NextRequest) {
  const query = new URLSearchParams();

  for (const parameter of allowedQueryParameters) {
    const value = request.nextUrl.searchParams.get(parameter);

    if (value) {
      query.set(parameter, value);
    }
  }

  const queryString = query.toString();

  return proxyAdminProductsRequest(
    `/admin/products${queryString ? `?${queryString}` : ""}`,
    { headers: authorizationHeaders(request) },
  );
}

export async function POST(request: NextRequest) {
  return proxyAdminProductsRequest("/admin/products", {
    method: "POST",
    headers: authorizationHeaders(request),
    body: await request.text(),
  });
}
