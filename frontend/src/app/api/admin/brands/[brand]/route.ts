import { NextRequest } from "next/server";
import { proxyAdminTaxonomyRequest } from "@/lib/adminTaxonomyProxy";

type Context = { params: Promise<{ brand: string }> };

function headers(request: NextRequest) {
  const result = new Headers();
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");
  if (authorization) result.set("Authorization", authorization);
  if (contentType) result.set("Content-Type", contentType);
  return result;
}

async function path(context: Context) {
  const { brand } = await context.params;
  return `/admin/brands/${encodeURIComponent(brand)}`;
}

export async function GET(request: NextRequest, context: Context) {
  return proxyAdminTaxonomyRequest(await path(context), { headers: headers(request) });
}

export async function PATCH(request: NextRequest, context: Context) {
  return proxyAdminTaxonomyRequest(await path(context), {
    method: "PATCH",
    headers: headers(request),
    body: await request.text(),
  });
}

export async function DELETE(request: NextRequest, context: Context) {
  return proxyAdminTaxonomyRequest(await path(context), {
    method: "DELETE",
    headers: headers(request),
  });
}
