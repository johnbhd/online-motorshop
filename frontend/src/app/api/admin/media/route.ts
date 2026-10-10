import { NextRequest } from "next/server";
import { proxyAdminMediaRequest } from "@/lib/adminMediaProxy";

const allowedQueryParameters = [
  "search",
  "type",
  "status",
  "sort",
  "page",
  "per_page",
] as const;

export async function GET(request: NextRequest) {
  const query = new URLSearchParams();

  for (const parameter of allowedQueryParameters) {
    const value = request.nextUrl.searchParams.get(parameter);

    if (value) {
      query.set(parameter, value);
    }
  }

  const headers = new Headers();
  const authorization = request.headers.get("authorization");

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  const queryString = query.toString();

  return proxyAdminMediaRequest(
    "/admin/media" + (queryString ? "?" + queryString : ""),
    { headers },
  );
}
