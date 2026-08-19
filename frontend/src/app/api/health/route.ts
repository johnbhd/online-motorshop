export async function GET() {
    try {
        const response = await fetch(
            `${process.env.LARAVEL_API_URL}/api/health`,
            {
                cache: "no-store",
            }
        );

        const data = await response.json();

        return Response.json(
            data,
            {
                status: response.status,
            }
        );
    } catch {
        return Response.json(
            {
                status: "error",
                message: "Unable to connect to Laravel API.",
            },
            {
                status: 502,
            }
        );
    }
}