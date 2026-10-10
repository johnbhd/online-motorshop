import { NextRequest } from "next/server";
import { proxyReviewRequest } from "@/lib/reviews/reviewProxy";

type Context = { params: Promise<{ review: string; action: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const { review, action } = await params;
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);
  return proxyReviewRequest(`/admin/reviews/${encodeURIComponent(review)}/${encodeURIComponent(action)}`, { method: "PATCH", headers });
}
