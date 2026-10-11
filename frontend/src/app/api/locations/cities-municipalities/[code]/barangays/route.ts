import { proxyLocationRequest } from "@/lib/locationProxy";

type BarangaysRouteContext = {
  params: Promise<{ code: string }>;
};

export async function GET(
  _request: Request,
  { params }: BarangaysRouteContext,
) {
  const { code } = await params;

  return proxyLocationRequest(
    `/locations/cities-municipalities/${encodeURIComponent(code)}/barangays`,
  );
}
