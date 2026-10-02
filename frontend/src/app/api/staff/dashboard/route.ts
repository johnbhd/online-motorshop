import { NextRequest } from "next/server";
import { proxyStaffDashboardRequest } from "@/lib/staffDashboardProxy";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const headers = new Headers();

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  return proxyStaffDashboardRequest({ headers });
}
