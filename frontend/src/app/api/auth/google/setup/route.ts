import { NextRequest, NextResponse } from "next/server";
import { proxyGoogleAuthRequest } from "@/lib/auth/googleAuthProxy";

export function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.json(
      {
        code: "google_setup_expired",
        message: "The Google registration setup has expired. Please start again.",
      },
      { status: 400 },
    );
  }

  return proxyGoogleAuthRequest(
    `/auth/google/setup/${encodeURIComponent(token)}`,
  );
}
