import { NextRequest } from "next/server";
import { proxyAdminReportsRequest } from "@/lib/adminReportsProxy";

const allowed = ["from", "to", "branch_id"] as const;

export async function GET(request: NextRequest) {
  const query = new URLSearchParams();

  for (const key of allowed) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) query.set(key, value);
  }

  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);

  return proxyAdminReportsRequest(
    `/admin/reports/data${query.toString() ? `?${query}` : ""}`,
    { headers },
  );
}
