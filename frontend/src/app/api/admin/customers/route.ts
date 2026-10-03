import { NextRequest } from "next/server";
import { proxyAdminCustomersRequest } from "@/lib/adminCustomersProxy";

const allowed = [
  "search",
  "type",
  "branch_id",
  "status",
  "page",
  "per_page",
  "order_per_page",
] as const;

function headers(request: NextRequest) {
  const result = new Headers();
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");

  if (authorization) result.set("Authorization", authorization);
  if (contentType) result.set("Content-Type", contentType);

  return result;
}

export async function GET(request: NextRequest) {
  const query = new URLSearchParams();

  for (const key of allowed) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) query.set(key, value);
  }

  return proxyAdminCustomersRequest(
    `/admin/customers${query.toString() ? `?${query}` : ""}`,
    { headers: headers(request) },
  );
}
