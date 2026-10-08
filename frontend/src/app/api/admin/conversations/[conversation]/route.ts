import { NextRequest } from "next/server";
import { proxyConversationRequest } from "@/lib/conversationProxy";

type AdminConversationRouteContext = {
  params: Promise<{ conversation: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: AdminConversationRouteContext,
) {
  const { conversation } = await params;
  const headers = new Headers();
  const authorization = request.headers.get("authorization");

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  return proxyConversationRequest(
    `/admin/conversations/${encodeURIComponent(conversation)}`,
    { headers },
  );
}
