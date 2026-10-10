import { NextRequest } from "next/server";
import { proxyCustomerProfileRequest } from "@/lib/customerProfileProxy";

export async function PATCH(request: NextRequest) {
  const headers = new Headers();
  const authorization = request.headers.get("authorization");

  if (authorization) headers.set("Authorization", authorization);
  headers.set(
    "Content-Type",
    request.headers.get("content-type") ?? "application/json",
  );

  return proxyCustomerProfileRequest("/customer/profile/password", {
    method: "PATCH",
    headers,
    body: await request.text(),
  });
}
