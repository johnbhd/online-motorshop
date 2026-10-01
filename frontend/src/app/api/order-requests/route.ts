import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authorization = request.headers.get("authorization");
    const headers = new Headers({
      Accept: "application/json",
      "Content-Type": "application/json",
    });

    if (authorization) {
      headers.set("Authorization", authorization);
    }

    const response = await fetch(
      `${process.env.LARAVEL_API_URL}/api/order-requests`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );
    const responseText = await response.text();

    if (!responseText) {
      return new NextResponse(null, {
        status: response.status,
      });
    }

    try {
      return NextResponse.json(JSON.parse(responseText) as unknown, {
        status: response.status,
      });
    } catch {
      return new NextResponse(responseText, {
        status: response.status,
        headers: {
          "Content-Type":
            response.headers.get("content-type") ?? "text/plain",
        },
      });
    }
  } catch {
    return NextResponse.json(
      {
        message: "Laravel API is unavailable.",
      },
      {
        status: 502,
      },
    );
  }
}
