import { proxyLocationRequest } from "@/lib/locationProxy";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();

  return proxyLocationRequest(
    `/locations/cities-municipalities${query ? `?q=${encodeURIComponent(query)}` : ""}`,
  );
}
