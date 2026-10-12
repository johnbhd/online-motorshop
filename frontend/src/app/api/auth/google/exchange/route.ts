import { NextRequest } from "next/server";
import { proxyGoogleAuthRequest } from "@/lib/auth/googleAuthProxy";

export async function POST(request: NextRequest) {
  return proxyGoogleAuthRequest("/auth/google/exchange", {
    method: "POST",
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
    },
    body: await request.text(),
  });
}
