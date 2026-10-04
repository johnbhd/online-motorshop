import { NextRequest } from "next/server";
import { proxyConversationRequest } from "@/lib/conversationProxy";

type ConversationMessageRouteContext = {
  params: Promise<{ conversation: string }>;
};

export async function POST(
  request: NextRequest,
  { params }: ConversationMessageRouteContext,
) {
  const { conversation } = await params;
  const headers = new Headers({ "Content-Type": "application/json" });
  const authorization = request.headers.get("authorization");

  if (authorization) headers.set("Authorization", authorization);

  return proxyConversationRequest(
    `/conversations/${encodeURIComponent(conversation)}/messages${request.nextUrl.search}`,
    { method: "POST", headers, body: await request.text() },
  );
}
