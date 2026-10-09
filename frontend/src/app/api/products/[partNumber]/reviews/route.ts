import { NextRequest } from "next/server";
import { proxyReviewRequest } from "@/lib/reviews/reviewProxy";

type Context = { params: Promise<{ partNumber: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { partNumber } = await params;
  const query = request.nextUrl.searchParams.toString();
  return proxyReviewRequest(`/products/${encodeURIComponent(partNumber)}/reviews${query ? `?${query}` : ""}`);
}
