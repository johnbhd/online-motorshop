import { NextRequest } from "next/server";
import { proxyAdminArchiveRequest } from "@/lib/adminArchiveProxy";

type Context = {
  params: Promise<{ type: string; record: string }>;
};

export async function POST(request: NextRequest, context: Context) {
  const { type, record } = await context.params;
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);

  return proxyAdminArchiveRequest(
    `/admin/archive/${encodeURIComponent(type)}/${encodeURIComponent(record)}/restore`,
    { method: "POST", headers },
  );
}
