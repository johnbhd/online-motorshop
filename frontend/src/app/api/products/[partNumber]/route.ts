import { proxyCatalogRequest } from "@/lib/catalog/catalogProxy";

type ProductRouteContext = {
  params: Promise<{ partNumber: string }>;
};

export async function GET(
  _request: Request,
  { params }: ProductRouteContext,
) {
  const { partNumber } = await params;

  return proxyCatalogRequest(`/products/${encodeURIComponent(partNumber)}`);
}
