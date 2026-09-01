// frontend/src/app/api/health/route.ts

import { NextResponse } from "next/server";

export async function GET() {
    try {
        const response = await fetch(
            `${process.env.LARAVEL_API_URL}/api/health`,
            {
                cache: "no-store",
            }
        );

        const data = await response.json();

        return NextResponse.json(data, {
            status: response.status,
        });
    } catch {
        return NextResponse.json(
            {
                status: "error",
                message: "Laravel API is unavailable.",
            },
            {
                status: 502,
            }
        );
    }
}