import { NextRequest } from "next/server";
import { proxyAdminProfileRequest } from "@/lib/adminProfileProxy";

function forwardHeaders(request: NextRequest) {
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  return headers;
}

export async function GET(request: NextRequest) {
  return proxyAdminProfileRequest("/admin/profile", {
    headers: forwardHeaders(request),
  });
}

export async function PATCH(request: NextRequest) {
  return proxyAdminProfileRequest("/admin/profile", {
    method: "PATCH",
    headers: forwardHeaders(request),
    body: await request.text(),
  });
}
