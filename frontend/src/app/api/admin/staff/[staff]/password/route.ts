import { NextRequest } from "next/server";
import { proxyAdminStaffRequest } from "@/lib/adminStaffProxy";

type Context = {
  params: Promise<{ staff: string }>;
};

export async function PATCH(request: NextRequest, context: Context) {
  const { staff } = await context.params;
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  return proxyAdminStaffRequest(
    `/admin/staff/${encodeURIComponent(staff)}/password`,
    {
      method: "PATCH",
      headers,
      body: await request.text(),
    },
  );
}
