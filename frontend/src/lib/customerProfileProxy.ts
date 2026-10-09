import { NextResponse } from "next/server";

function getLaravelApiUrl(): string | null {
  const baseUrl = process.env.LARAVEL_API_URL?.trim();

  return baseUrl ? baseUrl.replace(/\/$/, "") : null;
}

export async function proxyCustomerProfileRequest(
  path: string,
  init: RequestInit = {},
): Promise<NextResponse> {
  const baseUrl = getLaravelApiUrl();

  if (!baseUrl) {
    return NextResponse.json(
      { message: "The Laravel customer profile URL is not configured." },
      { status: 503 },
    );
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  try {
    const response = await fetch(`${baseUrl}/api${path}`, {
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
      { message: "The Laravel customer profile service could not be reached." },
      { status: 502 },
    );
  }
}
