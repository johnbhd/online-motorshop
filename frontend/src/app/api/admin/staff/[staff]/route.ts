import { NextRequest } from "next/server";
import { proxyAdminStaffRequest } from "@/lib/adminStaffProxy";

type Context = {
  params: Promise<{ staff: string }>;
};

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

async function path(context: Context) {
  const { staff } = await context.params;

  return `/admin/staff/${encodeURIComponent(staff)}`;
}

export async function GET(request: NextRequest, context: Context) {
  return proxyAdminStaffRequest(await path(context), {
    headers: headers(request),
  });
}

export async function PATCH(request: NextRequest, context: Context) {
  return proxyAdminStaffRequest(await path(context), {
    method: "PATCH",
    headers: headers(request),
    body: await request.text(),
  });
}

export async function DELETE(request: NextRequest, context: Context) {
  return proxyAdminStaffRequest(await path(context), {
    method: "DELETE",
    headers: headers(request),
  });
}
