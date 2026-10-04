import { NextRequest } from "next/server";
import { proxyStaffCustomersRequest } from "@/lib/staffCustomersProxy";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ customer: string }> },
) {
  const { customer } = await context.params;
  const authorization = request.headers.get("authorization");
  const headers = new Headers();

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  return proxyStaffCustomersRequest(
    `/staff/customers/${encodeURIComponent(customer)}`,
    { headers },
  );
}
