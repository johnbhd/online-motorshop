import { NextRequest } from "next/server";
import { proxyAdminMediaRequest } from "@/lib/adminMediaProxy";

type Context = {
  params: Promise<{ mediaAsset: string }>;
};

export async function POST(request: NextRequest, context: Context) {
  const { mediaAsset } = await context.params;
  const headers = new Headers();
  const authorization = request.headers.get("authorization");

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  return proxyAdminMediaRequest(
    "/admin/media/" +
      encodeURIComponent(mediaAsset) +
      "/retry-cleanup",
    {
      method: "POST",
      headers,
    },
  );
}
