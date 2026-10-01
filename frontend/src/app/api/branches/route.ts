import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      `${process.env.LARAVEL_API_URL}/api/branches`,
      {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );
    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
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
