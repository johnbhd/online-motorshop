import type {
  AdminBrandsResponse,
  AdminCategoriesResponse,
  AdminTaxonomyMutationResponse,
  AdminTaxonomyPayload,
  AdminTaxonomyProductsResponse,
} from "./adminTaxonomyTypes";

export class AdminTaxonomyApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "AdminTaxonomyApiError";
    this.status = status;
    this.payload = payload;
  }
}

type TaxonomyQuery = {
  search?: string;
  status?: string;
  page?: number;
  perPage?: number;
  signal?: AbortSignal;
};

type ApiErrorPayload = { message?: unknown; errors?: unknown };

export function getAdminCategories(token: string, query: TaxonomyQuery = {}) {
  return getList<AdminCategoriesResponse>(token, "categories", query);
}

export function getAdminBrands(token: string, query: TaxonomyQuery = {}) {
  return getList<AdminBrandsResponse>(token, "brands", query);
}

export async function getAdminCategoryProducts(
  token: string,
  id: number,
  query: TaxonomyQuery = {},
) {
  return getProducts(token, `categories/${id}/products`, query);
}

export async function getAdminBrandProducts(
  token: string,
  id: number,
  query: TaxonomyQuery = {},
) {
  return getProducts(token, `brands/${id}/products`, query);
}

export async function createAdminCategory(
  token: string,
  payload: AdminTaxonomyPayload,
) {
  return mutate<AdminTaxonomyMutationResponse>(token, "categories", "POST", payload);
}

export async function createAdminBrand(
  token: string,
  payload: AdminTaxonomyPayload,
) {
  return mutate<AdminTaxonomyMutationResponse>(token, "brands", "POST", payload);
}

export async function updateAdminCategory(
  token: string,
  id: number,
  payload: Partial<AdminTaxonomyPayload>,
) {
  return mutate<AdminTaxonomyMutationResponse>(token, `categories/${id}`, "PATCH", payload);
}

export async function updateAdminBrand(
  token: string,
  id: number,
  payload: Partial<AdminTaxonomyPayload>,
) {
  return mutate<AdminTaxonomyMutationResponse>(token, `brands/${id}`, "PATCH", payload);
}

export async function deleteAdminCategory(token: string, id: number) {
  return mutate<{ message: string }>(token, `categories/${id}`, "DELETE");
}

export async function deleteAdminBrand(token: string, id: number) {
  return mutate<{ message: string }>(token, `brands/${id}`, "DELETE");
}

export function getAdminTaxonomyErrorMessage(error: unknown): string {
  if (error instanceof AdminTaxonomyApiError) {
    if (error.status === 401) return "Your Admin session has expired. Please sign in again.";
    if (error.status === 403) return "You are not authorized to manage categories and brands.";
    if (error.status === 409) return error.message;
    if (error.status >= 500) return "The Admin Categories & Brands service is unavailable. Please try again.";
    return error.message;
  }

  return error instanceof Error && error.message
    ? error.message
    : "Unable to complete the taxonomy request.";
}

export function getTaxonomyValidationErrors(error: unknown): Record<string, string[]> {
  if (!(error instanceof AdminTaxonomyApiError)) return {};
  const payload = error.payload as ApiErrorPayload | null;
  if (!payload || typeof payload.errors !== "object" || payload.errors === null) return {};

  return Object.fromEntries(
    Object.entries(payload.errors).map(([field, messages]) => [
      field,
      Array.isArray(messages) ? messages.map(String) : [String(messages)],
    ]),
  );
}

async function getList<T>(token: string, resource: string, query: TaxonomyQuery): Promise<T> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({
    search: query.search,
    status: query.status,
    page: query.page,
    per_page: query.perPage,
  })) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }

  return request<T>(`/api/admin/${resource}${params.size ? `?${params}` : ""}`, token, {
    signal: query.signal,
  });
}

function getProducts(token: string, resource: string, query: TaxonomyQuery) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ page: query.page, per_page: query.perPage })) {
    if (value !== undefined) params.set(key, String(value));
  }
  return request<AdminTaxonomyProductsResponse>(
    `/api/admin/${resource}${params.size ? `?${params}` : ""}`,
    token,
    { signal: query.signal },
  );
}

async function mutate<T>(token: string, resource: string, method: string, payload?: unknown): Promise<T> {
  return request<T>(`/api/admin/${resource}`, token, {
    method,
    headers: { "Content-Type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
}

async function request<T>(url: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
    cache: "no-store",
  });
  const text = await response.text();
  let payload: unknown = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  if (!response.ok) {
    const message = typeof (payload as ApiErrorPayload | null)?.message === "string"
      ? (payload as ApiErrorPayload).message as string
      : `Admin taxonomy request failed with status ${response.status}.`;
    throw new AdminTaxonomyApiError(response.status, message, payload);
  }
  return payload as T;
}
