import { toCatalogProducts } from "./catalogAdapters";
import type {
  CatalogBranchesResponse,
  CatalogCategoriesResponse,
  CatalogProductsResponse,
  CatalogRequestOptions,
  CatalogProductsResult,
  CatalogBranch,
  CatalogCategory,
} from "./catalogTypes";

export class CatalogClientError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "CatalogClientError";
    this.status = status;
  }
}

async function requestJson<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      signal,
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new CatalogClientError("The catalog could not be reached.", 502);
  }

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String(payload.message)
        : `Catalog request failed with status ${response.status}.`;

    throw new CatalogClientError(message, response.status);
  }

  return payload as T;
}

function buildProductQuery(options: CatalogRequestOptions) {
  const query = new URLSearchParams();

  if (options.search?.trim()) query.set("search", options.search.trim());
  if (options.brand?.trim()) query.set("brand", options.brand.trim());
  if (options.category?.trim()) query.set("category", options.category.trim());
  if (options.sort === "price-asc") query.set("sort", "price_asc");
  if (options.sort === "price-desc") query.set("sort", "price_desc");
  if (options.page) query.set("page", String(options.page));
  if (options.perPage) query.set("per_page", String(options.perPage));

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

export async function getCatalogProductsFromApi(
  options: CatalogRequestOptions = {},
): Promise<CatalogProductsResult> {
  const response = await requestJson<CatalogProductsResponse>(
    `/api/products${buildProductQuery(options)}`,
    options.signal,
  );

  return {
    products: toCatalogProducts(response.products),
    meta: response.meta,
  };
}

export async function getCatalogCategoriesFromApi(
  signal?: AbortSignal,
): Promise<CatalogCategory[]> {
  const response = await requestJson<CatalogCategoriesResponse>(
    "/api/categories",
    signal,
  );

  return response.categories;
}

export async function getCatalogBranchesFromApi(
  signal?: AbortSignal,
): Promise<CatalogBranch[]> {
  const response = await requestJson<CatalogBranchesResponse>(
    "/api/branches",
    signal,
  );

  return response.branches;
}
