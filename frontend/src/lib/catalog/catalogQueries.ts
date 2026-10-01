import { toAboutBranch, toCatalogProduct, toCatalogProducts } from "./catalogAdapters";
import type {
  CatalogBranchesResponse,
  CatalogCategoriesResponse,
  CatalogProductResponse,
  CatalogProductResult,
  CatalogProductsResponse,
  CatalogProductsResult,
  CatalogRequestOptions,
  CatalogCategory,
} from "./catalogTypes";

export class CatalogApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status = 500, payload?: unknown) {
    super(message);
    this.name = "CatalogApiError";
    this.status = status;
    this.payload = payload;
  }
}

function getLaravelApiUrl() {
  const baseUrl = process.env.LARAVEL_API_URL?.trim();

  if (!baseUrl) {
    throw new CatalogApiError(
      "The Laravel catalog URL is not configured.",
      503,
    );
  }

  return baseUrl.replace(/\/$/, "");
}

function getCatalogUrl(path: string) {
  return `${getLaravelApiUrl()}/api${path}`;
}

async function readResponsePayload(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function fetchCatalogJson<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(getCatalogUrl(path), {
      cache: "no-store",
      signal,
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new CatalogApiError(
      "The Laravel catalog could not be reached.",
      502,
      error,
    );
  }

  const payload = await readResponsePayload(response);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String(payload.message)
        : `Catalog request failed with status ${response.status}.`;

    throw new CatalogApiError(message, response.status, payload);
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

export async function getCatalogProducts(
  options: CatalogRequestOptions = {},
): Promise<CatalogProductsResult> {
  const response = await fetchCatalogJson<CatalogProductsResponse>(
    `/products${buildProductQuery(options)}`,
    options.signal,
  );

  return {
    products: toCatalogProducts(response.products),
    meta: response.meta,
  };
}

export async function getCatalogProduct(
  partNumber: string,
): Promise<CatalogProductResult> {
  const response = await fetchCatalogJson<CatalogProductResponse>(
    `/products/${encodeURIComponent(partNumber)}`,
  );

  return { product: toCatalogProduct(response.product) };
}

export async function getCatalogCategories(): Promise<CatalogCategory[]> {
  const response = await fetchCatalogJson<CatalogCategoriesResponse>(
    "/categories",
  );

  return response.categories;
}

export async function getCatalogBranches() {
  const response = await fetchCatalogJson<CatalogBranchesResponse>("/branches");

  return response.branches.map(toAboutBranch);
}
