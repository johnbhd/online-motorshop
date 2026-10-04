import { NextRequest } from "next/server";
import { proxyStaffProfileRequest } from "@/lib/staffProfileProxy";

function authorizationHeaders(request: NextRequest) {
  const headers = new Headers();
  const authorization = request.headers.get("authorization");

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  return headers;
}

export async function GET(request: NextRequest) {
  return proxyStaffProfileRequest("/staff/profile", {
    method: "GET",
    headers: authorizationHeaders(request),
  });
}

export async function PATCH(request: NextRequest) {
  const headers = authorizationHeaders(request);
  headers.set("Content-Type", "application/json");

  return proxyStaffProfileRequest("/staff/profile", {
    method: "PATCH",
    headers,
    body: await request.text(),
  });
}
