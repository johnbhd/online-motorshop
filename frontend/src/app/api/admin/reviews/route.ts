import { NextRequest } from "next/server";
import { proxyReviewRequest } from "@/lib/reviews/reviewProxy";

export async function GET(request: NextRequest) {
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);
  const query = request.nextUrl.searchParams.toString();
  return proxyReviewRequest(`/admin/reviews${query ? `?${query}` : ""}`, { headers });
}
