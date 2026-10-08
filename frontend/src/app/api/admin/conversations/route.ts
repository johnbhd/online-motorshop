import { NextRequest } from "next/server";
import { proxyConversationRequest } from "@/lib/conversationProxy";

const allowedQueryKeys = ["search", "status", "needs_reply", "page", "per_page"];

export async function GET(request: NextRequest) {
  const headers = new Headers();
  const authorization = request.headers.get("authorization");

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  const query = new URLSearchParams();

  for (const key of allowedQueryKeys) {
    const value = request.nextUrl.searchParams.get(key)?.trim();

    if (value) {
      query.set(key, value);
    }
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  return proxyConversationRequest(`/admin/conversations${suffix}`, { headers });
}
