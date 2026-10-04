import { NextRequest } from "next/server";
import { proxyAdminStaffRequest } from "@/lib/adminStaffProxy";

const allowed = ["search", "branch_id", "status", "page", "per_page"] as const;

function headers(request: NextRequest) {
  const result = new Headers();
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");

  if (authorization) {
    result.set("Authorization", authorization);
  }

  if (contentType) {
    result.set("Content-Type", contentType);
  }

  return result;
}

export async function GET(request: NextRequest) {
  const query = new URLSearchParams();

  for (const key of allowed) {
    const value = request.nextUrl.searchParams.get(key);

    if (value) {
      query.set(key, value);
    }
  }

  const suffix = query.toString() ? `?${query}` : "";

  return proxyAdminStaffRequest(`/admin/staff${suffix}`, {
    headers: headers(request),
  });
}

export async function POST(request: NextRequest) {
  return proxyAdminStaffRequest("/admin/staff", {
    method: "POST",
    headers: headers(request),
    body: await request.text(),
  });
}
