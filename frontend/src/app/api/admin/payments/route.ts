import { NextRequest } from "next/server";
import { proxyAdminPaymentsRequest } from "@/lib/adminPaymentsProxy";

const allowed = ["search", "branch_id", "method", "status", "fulfillment", "page", "per_page"] as const;

function headers(request: NextRequest) {
  const result = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) result.set("Authorization", authorization);
  return result;
}

export async function GET(request: NextRequest) {
  const query = new URLSearchParams();

  for (const key of allowed) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) query.set(key, value);
  }

  return proxyAdminPaymentsRequest(
    `/admin/payments${query.toString() ? `?${query}` : ""}`,
    { headers: headers(request) },
  );
}
