import { NextRequest } from "next/server";
import { proxyAdminTaxonomyRequest } from "@/lib/adminTaxonomyProxy";

type Context = { params: Promise<{ brand: string }> };

export async function GET(request: NextRequest, context: Context) {
  const { brand } = await context.params;
  const query = new URLSearchParams();
  for (const key of ["page", "per_page"] as const) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) query.set(key, value);
  }
  const suffix = query.toString() ? `?${query}` : "";
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);
  return proxyAdminTaxonomyRequest(
    `/admin/brands/${encodeURIComponent(brand)}/products${suffix}`,
    { headers },
  );
}
