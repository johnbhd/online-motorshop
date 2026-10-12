import { NextRequest, NextResponse } from "next/server";
import { getGoogleBackendUrl } from "@/lib/auth/googleAuthProxy";
import { getSafeGoogleReturnTo } from "@/lib/auth/authApi";

export function GET(request: NextRequest) {
  const returnTo = getSafeGoogleReturnTo(
    request.nextUrl.searchParams.get("return_to"),
  );
  const backendUrl = getGoogleBackendUrl(
    `/auth/google/redirect?return_to=${encodeURIComponent(returnTo)}`,
  );

  if (backendUrl) {
    return NextResponse.redirect(new URL(backendUrl));
  }

  const unavailableUrl = new URL("/auth/google/callback", request.url);
  unavailableUrl.searchParams.set("error", "google_auth_unavailable");
  unavailableUrl.searchParams.set("return_to", returnTo);

  return NextResponse.redirect(unavailableUrl);
}
