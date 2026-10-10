import { NextRequest } from "next/server";
import { proxyConversationRequest } from "@/lib/conversationProxy";

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type");
  const headers = new Headers({
    "Content-Type": contentType ?? "application/json",
  });
  const authorization = request.headers.get("authorization");

  if (authorization) headers.set("Authorization", authorization);

  const body = contentType?.startsWith("multipart/form-data")
    ? await request.arrayBuffer()
    : await request.text();

  return proxyConversationRequest("/conversations", {
    method: "POST",
    headers,
    body,
  });
}
