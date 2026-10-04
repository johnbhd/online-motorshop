import { NextRequest } from "next/server";
import { proxyConversationRequest } from "@/lib/conversationProxy";

type StaffConversationMessageRouteContext = {
  params: Promise<{ conversation: string }>;
};

export async function POST(
  request: NextRequest,
  { params }: StaffConversationMessageRouteContext,
) {
  const { conversation } = await params;
  const headers = new Headers({ "Content-Type": "application/json" });
  const authorization = request.headers.get("authorization");

  if (authorization) headers.set("Authorization", authorization);

  return proxyConversationRequest(
    `/staff/conversations/${encodeURIComponent(conversation)}/messages`,
    { method: "POST", headers, body: await request.text() },
  );
}
