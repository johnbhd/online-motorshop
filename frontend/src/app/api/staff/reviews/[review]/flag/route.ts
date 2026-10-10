import { NextRequest } from "next/server";
import { proxyReviewRequest } from "@/lib/reviews/reviewProxy";

type Context = { params: Promise<{ review: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const { review } = await params;
  const headers = new Headers({ "Content-Type": "application/json" });
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);
  return proxyReviewRequest(`/staff/reviews/${encodeURIComponent(review)}/flag`, { method: "PATCH", headers, body: await request.text() });
}
