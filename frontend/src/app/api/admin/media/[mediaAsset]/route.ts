import { NextRequest } from "next/server";
import { proxyAdminMediaRequest } from "@/lib/adminMediaProxy";

type Context = {
  params: Promise<{ mediaAsset: string }>;
};

function headers(request: NextRequest): Headers {
  const result = new Headers();
  const authorization = request.headers.get("authorization");

  if (authorization) {
    result.set("Authorization", authorization);
  }

  return result;
}

async function path(context: Context): Promise<string> {
  const { mediaAsset } = await context.params;

  return "/admin/media/" + encodeURIComponent(mediaAsset);
}

export async function GET(request: NextRequest, context: Context) {
  return proxyAdminMediaRequest(await path(context), {
    headers: headers(request),
  });
}

export async function DELETE(request: NextRequest, context: Context) {
  return proxyAdminMediaRequest(await path(context), {
    method: "DELETE",
    headers: headers(request),
  });
}
