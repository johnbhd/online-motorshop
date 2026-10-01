import { NextResponse } from "next/server";

function getLaravelApiUrl() {
  const baseUrl = process.env.LARAVEL_API_URL?.trim();

  return baseUrl ? baseUrl.replace(/\/$/, "") : null;
}

function getBackendUrl(path: string) {
  const baseUrl = getLaravelApiUrl();

  return baseUrl ? `${baseUrl}/api${path}` : null;
}

export async function proxyCatalogRequest(
  path: string,
  init?: RequestInit,
) {
  const backendUrl = getBackendUrl(path);

  if (!backendUrl) {
    return NextResponse.json(
      { message: "The Laravel catalog URL is not configured." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(backendUrl, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
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
      { message: "The Laravel catalog could not be reached." },
      { status: 502 },
    );
  }
}
