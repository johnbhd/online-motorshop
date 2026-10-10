import { NextRequest } from "next/server";
import { proxyCustomerNotificationRequest } from "@/lib/notificationProxy";

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

  return proxyCustomerNotificationRequest(
    `/customer/notifications${queryString ? `?${queryString}` : ""}`,
    { headers },
  );
}

export async function PATCH(request: NextRequest) {
  const headers = new Headers();
  const authorization = request.headers.get("authorization");

  if (authorization) headers.set("Authorization", authorization);

  return proxyCustomerNotificationRequest(
    "/customer/notifications/read-all",
    { method: "PATCH", headers },
  );
}
