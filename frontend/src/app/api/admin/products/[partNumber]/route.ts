import { NextRequest } from "next/server";
import { proxyAdminProductsRequest } from "@/lib/adminProductsProxy";

type ProductRouteContext = {
  params: Promise<{ partNumber: string }>;
};

function authorizationHeaders(request: NextRequest) {
  const headers = new Headers();
  const authorization = request.headers.get("authorization");

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  return headers;
}

async function targetPath(
  context: ProductRouteContext,
): Promise<string> {
  const { partNumber } = await context.params;

  return `/admin/products/${encodeURIComponent(partNumber)}`;
}

export async function GET(
  request: NextRequest,
  context: ProductRouteContext,
) {
  return proxyAdminProductsRequest(await targetPath(context), {
    headers: authorizationHeaders(request),
  });
}

export async function PATCH(
  request: NextRequest,
  context: ProductRouteContext,
) {
  return proxyAdminProductsRequest(await targetPath(context), {
    method: "PATCH",
    headers: authorizationHeaders(request),
    body: await request.formData(),
  });
}

export async function POST(
  request: NextRequest,
  context: ProductRouteContext,
) {
  return proxyAdminProductsRequest(await targetPath(context), {
    method: "POST",
    headers: authorizationHeaders(request),
    body: await request.formData(),
  });
}

export async function DELETE(
  request: NextRequest,
  context: ProductRouteContext,
) {
  return proxyAdminProductsRequest(await targetPath(context), {
    method: "DELETE",
    headers: authorizationHeaders(request),
  });
}
