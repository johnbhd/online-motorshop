import { NextRequest } from "next/server";
import { proxyAdminDeliveryRequestsRequest } from "@/lib/adminDeliveryRequestsProxy";

const allowed = [
  "search",
  "branch_id",
  "assigned_staff_id",
  "status",
  "page",
  "per_page",
] as const;

export async function GET(request: NextRequest) {
  const query = new URLSearchParams();

  for (const key of allowed) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) query.set(key, value);
  }

  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);

  return proxyAdminDeliveryRequestsRequest(
    `/admin/delivery-requests${query.size ? `?${query}` : ""}`,
    { headers },
  );
}
