import { NextRequest } from "next/server";
import { proxyCustomerNotificationRequest } from "@/lib/notificationProxy";

type RouteContext = { params: Promise<{ notification: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { notification } = await params;
  const headers = new Headers();
  const authorization = request.headers.get("authorization");

  if (authorization) headers.set("Authorization", authorization);

  return proxyCustomerNotificationRequest(
    `/customer/notifications/${encodeURIComponent(notification)}/read`,
    { method: "PATCH", headers },
  );
}
