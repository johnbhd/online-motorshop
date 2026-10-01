import { proxyCatalogRequest } from "@/lib/catalog/catalogProxy";

export async function GET() {
  return proxyCatalogRequest("/branches");
}
