import { NextRequest } from "next/server";
import { proxyConversationRequest } from "@/lib/conversationProxy";

type ConversationReadRouteContext = {
  params: Promise<{ conversation: string }>;
};

export async function POST(
  request: NextRequest,
  { params }: ConversationReadRouteContext,
) {
  const { conversation } = await params;
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  const guestToken = request.headers.get("x-guest-token");

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  if (guestToken) {
    headers.set("X-Guest-Token", guestToken);
  }

  return proxyConversationRequest(
    `/conversations/${encodeURIComponent(conversation)}/read`,
    { method: "POST", headers },
  );
}
