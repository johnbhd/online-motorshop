import { NextRequest } from "next/server";
import { proxyPortalNotificationRequest } from "@/lib/portalNotificationProxy";

const allowedQueryParameters = ["category", "page", "per_page"] as const;

export async function GET(request: NextRequest) {
  const query = new URLSearchParams();
  for (const parameter of allowedQueryParameters) {
    const value = request.nextUrl.searchParams.get(parameter);
    if (value) query.set(parameter, value);
  }
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);
  const queryString = query.toString();
  return proxyPortalNotificationRequest(`/admin/notifications${queryString ? `?${queryString}` : ""}`, { headers });
}

export async function PATCH(request: NextRequest) {
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);
  return proxyPortalNotificationRequest("/admin/notifications/read-all", { method: "PATCH", headers });
}
