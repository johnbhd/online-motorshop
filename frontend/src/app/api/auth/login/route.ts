import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        const response = await fetch(
            `${process.env.LARAVEL_API_URL}/api/auth/login`,
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
                cache: "no-store"
            }
        );

        const data = await response.json();

        return NextResponse.json(data, {
            status: response.status
        });

    } catch {
        return NextResponse.json(
            {
                message: "Laravel API is unavailable"
            }, 
            {
                status: 502,
            }
        )
    }
}