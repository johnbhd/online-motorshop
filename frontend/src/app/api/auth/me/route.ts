import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const authorization = request.headers.get("authorization");

        const response = await fetch(
            `${process.env.LARAVEL_API_URL}/api/auth/me`,
            {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    Authorization: authorization ?? "",
                },
                cache: "no-store",
            }
        );

        const data = await response.json();

        return NextResponse.json(data, {
            status: response.status
        });
    } catch {
        return NextResponse.json(
            {
                message: "Laravel API is unavailable",
            },
            {
                status: 502,
            }
        );
    }
}