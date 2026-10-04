import { NextRequest } from "next/server";
import { proxyAdminDashboardRequest } from "@/lib/adminDashboardProxy";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const headers = new Headers();

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  return proxyAdminDashboardRequest({ headers });
}
