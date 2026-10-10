import { NextRequest } from "next/server";
import { proxyReviewRequest } from "@/lib/reviews/reviewProxy";

type Context = { params: Promise<{ partNumber: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { partNumber } = await params;
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);
  return proxyReviewRequest(`/customer/products/${encodeURIComponent(partNumber)}/reviews/eligibility`, { headers });
}
