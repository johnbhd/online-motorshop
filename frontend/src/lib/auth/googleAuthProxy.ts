import { NextResponse } from "next/server";

function getLaravelApiUrl() {
  const baseUrl = process.env.LARAVEL_API_URL?.trim();

  return baseUrl ? baseUrl.replace(/\/$/, "") : null;
}

export function getGoogleBackendUrl(path: string) {
  const baseUrl = getLaravelApiUrl();

  return baseUrl ? `${baseUrl}/api${path}` : null;
}

export async function proxyGoogleAuthRequest(
  path: string,
  init: RequestInit = {},
) {
  const backendUrl = getGoogleBackendUrl(path);

  if (!backendUrl) {
    return NextResponse.json(
      { code: "google_auth_unavailable", message: "Google authentication is not configured." },
      { status: 503 },
    );
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  try {
    const response = await fetch(backendUrl, {
      ...init,
      headers,
      cache: "no-store",
    });

    return new NextResponse(await response.text(), {
      status: response.status,
      headers: {
        "content-type":
          response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      {
        code: "google_auth_unavailable",
        message: "The Google authentication service could not be reached.",
      },
      { status: 502 },
    );
  }
}
