import { proxyCatalogRequest } from "@/lib/catalog/catalogProxy";

const allowedQueryParameters = [
  "search",
  "brand",
  "category",
  "sort",
  "page",
  "per_page",
] as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = new URLSearchParams();

  for (const parameter of allowedQueryParameters) {
    const value = url.searchParams.get(parameter);

    if (value) {
      query.set(parameter, value);
    }
  }

  const queryString = query.toString();

  return proxyCatalogRequest(`/products${queryString ? `?${queryString}` : ""}`);
}
