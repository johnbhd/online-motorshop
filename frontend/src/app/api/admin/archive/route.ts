import { NextRequest } from "next/server";
import { proxyAdminArchiveRequest } from "@/lib/adminArchiveProxy";

const allowedQueryParameters = ["type", "search", "page", "per_page"] as const;

export async function GET(request: NextRequest) {
  const query = new URLSearchParams();

  for (const parameter of allowedQueryParameters) {
    const value = request.nextUrl.searchParams.get(parameter);
    if (value) query.set(parameter, value);
  }

  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);

  const queryString = query.toString();
  return proxyAdminArchiveRequest(
    `/admin/archive${queryString ? `?${queryString}` : ""}`,
    { headers },
  );
}
