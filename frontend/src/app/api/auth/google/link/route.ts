import { NextRequest, NextResponse } from "next/server";
import { proxyGoogleAuthRequest } from "@/lib/auth/googleAuthProxy";

export function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.json(
      {
        code: "google_link_expired",
        message: "The Google account-link request has expired. Please start again.",
      },
      { status: 400 },
    );
  }

  return proxyGoogleAuthRequest(
    `/auth/google/link/${encodeURIComponent(token)}`,
  );
}

export async function POST(request: NextRequest) {
  return proxyGoogleAuthRequest("/auth/google/link", {
    method: "POST",
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
    },
    body: await request.text(),
  });
}
