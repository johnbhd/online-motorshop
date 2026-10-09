import { NextRequest } from "next/server";
import { proxyAdminPickupRequestsRequest } from "@/lib/adminPickupRequestsProxy";

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

  return proxyAdminPickupRequestsRequest(
    `/admin/pickup-requests${query.size ? `?${query}` : ""}`,
    { headers },
  );
}
