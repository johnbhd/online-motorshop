import { NextRequest } from "next/server";
import { proxyConversationRequest } from "@/lib/conversationProxy";

export async function GET(request: NextRequest) {
  const headers = new Headers();
  const authorization = request.headers.get("authorization");

  if (authorization) headers.set("Authorization", authorization);

  return proxyConversationRequest(
    `/staff/conversations${request.nextUrl.search}`,
    { headers },
  );
}
