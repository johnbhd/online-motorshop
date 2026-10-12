import { NextResponse } from "next/server";

function baseUrl(): string | null {
  const value = process.env.LARAVEL_API_URL?.trim();
  return value ? value.replace(/\/$/, "") : null;
}

export async function proxyAdminArchiveRequest(
  path: string,
  init: RequestInit = {},
): Promise<NextResponse> {
  const url = baseUrl();

  if (!url) {
    return NextResponse.json(
      { message: "The Laravel Admin Archive URL is not configured." },
      { status: 503 },
    );
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  try {
    const response = await fetch(`${url}/api${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
    const body = await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "The Laravel Admin Archive service could not be reached." },
      { status: 502 },
    );
  }
}
