import { NextRequest } from "next/server";
import { proxyConversationRequest } from "@/lib/conversationProxy";

type StaffConversationRouteContext = {
  params: Promise<{ conversation: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: StaffConversationRouteContext,
) {
  const { conversation } = await params;
  const headers = new Headers();
  const authorization = request.headers.get("authorization");

  if (authorization) headers.set("Authorization", authorization);

  return proxyConversationRequest(
    `/staff/conversations/${encodeURIComponent(conversation)}`,
    { headers },
  );
}
