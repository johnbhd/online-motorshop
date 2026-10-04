import { NextRequest } from "next/server";
import { proxyStaffSidebarRequest } from "@/lib/staffSidebarProxy";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const headers = new Headers();

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  return proxyStaffSidebarRequest({ headers });
}
