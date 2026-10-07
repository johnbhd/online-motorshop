import { NextResponse } from "next/server";

function getLaravelApiUrl(): string | null {
  const baseUrl = process.env.LARAVEL_API_URL?.trim();

  return baseUrl ? baseUrl.replace(/\/$/, "") : null;
}

export async function proxyAdminSettingsRequest(
  init: RequestInit = {},
): Promise<NextResponse> {
  const baseUrl = getLaravelApiUrl();

  if (!baseUrl) {
    return NextResponse.json(
      { message: "The Laravel Admin settings URL is not configured." },
      { status: 503 },
    );
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  try {
    const response = await fetch(`${baseUrl}/api/admin/settings`, {
      ...init,
      headers,
      cache: "no-store",
    });
    const body = await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "content-type":
          response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "The Admin Settings service could not be reached." },
      { status: 502 },
    );
  }
}
