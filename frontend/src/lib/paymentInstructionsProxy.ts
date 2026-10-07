import { NextResponse } from "next/server";

export async function proxyPaymentInstructionsRequest(): Promise<NextResponse> {
  const baseUrl = process.env.LARAVEL_API_URL?.trim().replace(/\/$/, "");

  if (!baseUrl) {
    return NextResponse.json(
      { message: "The Laravel payment instructions URL is not configured." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(`${baseUrl}/api/payment-instructions`, {
      headers: { Accept: "application/json" },
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
      { message: "The payment instructions service could not be reached." },
      { status: 502 },
    );
  }
}
