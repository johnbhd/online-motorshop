import { proxyLocationRequest } from "@/lib/locationProxy";

export async function POST(request: Request) {
  const body = await request.text();

  return proxyLocationRequest("/locations/reverse-geocode", {
    method: "POST",
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
    },
    body,
  });
}
