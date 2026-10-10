import { NextRequest } from "next/server";
import { proxyPortalNotificationRequest } from "@/lib/portalNotificationProxy";

type RouteContext = { params: Promise<{ notification: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { notification } = await params;
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);
  return proxyPortalNotificationRequest(`/admin/notifications/${encodeURIComponent(notification)}/read`, { method: "PATCH", headers });
}
