import { NextRequest } from "next/server";
import { proxyConversationRequest } from "@/lib/conversationProxy";

export async function POST(request: NextRequest) {
  const headers = new Headers({ "Content-Type": "application/json" });
  const authorization = request.headers.get("authorization");

  if (authorization) headers.set("Authorization", authorization);

  return proxyConversationRequest("/conversations", {
    method: "POST",
    headers,
    body: await request.text(),
  });
}
