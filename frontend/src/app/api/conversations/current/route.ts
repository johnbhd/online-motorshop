import { NextRequest } from "next/server";
import { proxyConversationRequest } from "@/lib/conversationProxy";

export async function GET(request: NextRequest) {
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  const guestToken = request.headers.get("x-guest-token");

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  if (guestToken) {
    headers.set("X-Guest-Token", guestToken);
  }

  return proxyConversationRequest("/conversations/current", { headers });
}
