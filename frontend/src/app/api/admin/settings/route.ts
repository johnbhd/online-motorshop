import { NextRequest } from "next/server";
import { proxyAdminSettingsRequest } from "@/lib/adminSettingsProxy";

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
  return proxyAdminSettingsRequest({
    headers: forwardHeaders(request),
  });
}

export async function POST(request: NextRequest) {
  return proxyAdminSettingsRequest({
    method: "POST",
    headers: forwardHeaders(request),
    body: await request.arrayBuffer(),
  });
}
