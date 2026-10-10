import { NextResponse } from "next/server";

function getBaseUrl() {
  const value = process.env.LARAVEL_API_URL?.trim();
  return value ? value.replace(/\/$/, "") : null;
}

export async function proxyReviewRequest(path: string, init: RequestInit = {}) {
  const baseUrl = getBaseUrl();
  if (!baseUrl) return NextResponse.json({ message: "The Laravel review service is not configured." }, { status: 503 });

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  try {
    const response = await fetch(`${baseUrl}/api${path}`, { ...init, headers, cache: "no-store" });
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json({ message: "The Laravel review service could not be reached." }, { status: 502 });
  }
}
