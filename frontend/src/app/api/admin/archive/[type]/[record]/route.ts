import { NextRequest } from "next/server";
import { proxyAdminArchiveRequest } from "@/lib/adminArchiveProxy";

type Context = {
  params: Promise<{ type: string; record: string }>;
};

function headers(request: NextRequest) {
  const result = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) result.set("Authorization", authorization);
  return result;
}

async function path(context: Context) {
  const { type, record } = await context.params;
  return `/admin/archive/${encodeURIComponent(type)}/${encodeURIComponent(record)}`;
}

export async function POST(request: NextRequest, context: Context) {
  return proxyAdminArchiveRequest(await path(context), {
    method: "POST",
    headers: headers(request),
  });
}

export async function DELETE(request: NextRequest, context: Context) {
  return proxyAdminArchiveRequest(await path(context), {
    method: "DELETE",
    headers: headers(request),
  });
}
