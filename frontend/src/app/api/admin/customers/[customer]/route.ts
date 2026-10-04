import { NextRequest } from "next/server";
import { proxyAdminCustomersRequest } from "@/lib/adminCustomersProxy";

type Context = {
  params: Promise<{ customer: string }>;
};

function headers(request: NextRequest) {
  const result = new Headers();
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");

  if (authorization) result.set("Authorization", authorization);
  if (contentType) result.set("Content-Type", contentType);

  return result;
}

async function path(context: Context) {
  const { customer } = await context.params;
  return `/admin/customers/${encodeURIComponent(customer)}`;
}

export async function GET(request: NextRequest, context: Context) {
  return proxyAdminCustomersRequest(await path(context), {
    headers: headers(request),
  });
}

export async function PATCH(request: NextRequest, context: Context) {
  return proxyAdminCustomersRequest(await path(context), {
    method: "PATCH",
    headers: headers(request),
    body: await request.text(),
  });
}

export async function DELETE(request: NextRequest, context: Context) {
  return proxyAdminCustomersRequest(await path(context), {
    method: "DELETE",
    headers: headers(request),
  });
}
