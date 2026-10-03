import type {
  AdminProduct,
  AdminProductDeleteResponse,
  AdminProductDetailsResponse,
  AdminProductMutationResponse,
  AdminProductPayload,
  AdminProductsResponse,
} from "./adminProductsTypes";

type RequestOptions = {
  signal?: AbortSignal;
};

type ProductQuery = {
  search?: string;
  brand?: string;
  category?: string;
  status?: string;
  availabilityStatus?: string;
  sort?: string;
  page?: number;
  perPage?: number;
  signal?: AbortSignal;
};

type ApiErrorPayload = {
  message?: unknown;
  errors?: unknown;
};

export class AdminProductsApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "AdminProductsApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function getAdminProducts(
  token: string,
  query: ProductQuery = {},
): Promise<AdminProductsResponse> {
  const params = new URLSearchParams();
  const values: Record<string, string | number | undefined> = {
    search: query.search,
    brand: query.brand,
    category: query.category,
    status: query.status,
    availability_status: query.availabilityStatus,
    sort: query.sort,
    page: query.page,
    per_page: query.perPage,
  };

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  const response = await fetch(
    `/api/admin/products${params.size ? `?${params.toString()}` : ""}`,
    {
      headers: authHeaders(token),
      cache: "no-store",
      signal: query.signal,
    },
  );

  return parseResponse<AdminProductsResponse>(response);
}

export async function getAdminProduct(
  token: string,
  partNumber: string,
  options: RequestOptions = {},
): Promise<AdminProduct> {
  const response = await fetch(
    `/api/admin/products/${encodeURIComponent(partNumber)}`,
    {
      headers: authHeaders(token),
      cache: "no-store",
      signal: options.signal,
    },
  );
  const payload = await parseResponse<AdminProductDetailsResponse>(response);

  return payload.product;
}

export async function createAdminProduct(
  token: string,
  product: AdminProductPayload,
): Promise<AdminProductMutationResponse> {
  const response = await fetch("/api/admin/products", {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });

  return parseResponse<AdminProductMutationResponse>(response);
}

export async function updateAdminProduct(
  token: string,
  originalPartNumber: string,
  product: Partial<AdminProductPayload>,
): Promise<AdminProductMutationResponse> {
  const response = await fetch(
    `/api/admin/products/${encodeURIComponent(originalPartNumber)}`,
    {
      method: "PATCH",
      headers: { ...authHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify(product),
    },
  );

  return parseResponse<AdminProductMutationResponse>(response);
}

export async function deleteAdminProduct(
  token: string,
  partNumber: string,
): Promise<AdminProductDeleteResponse> {
  const response = await fetch(
    `/api/admin/products/${encodeURIComponent(partNumber)}`,
    {
      method: "DELETE",
      headers: authHeaders(token),
    },
  );

  return parseResponse<AdminProductDeleteResponse>(response);
}

export function getAdminProductsErrorMessage(error: unknown): string {
  if (error instanceof AdminProductsApiError) {
    if (error.status === 401) {
      return "Your Admin session has expired. Please sign in again.";
    }

    if (error.status === 403) {
      return "You are not authorized to manage products.";
    }

    if (error.status >= 500) {
      return "The Admin Products service is unavailable. Please try again.";
    }

    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unable to complete the product request.";
}

export function getValidationErrors(error: unknown): Record<string, string[]> {
  if (!(error instanceof AdminProductsApiError)) {
    return {};
  }

  const payload = asErrorPayload(error.payload);

  if (!payload || typeof payload.errors !== "object" || payload.errors === null) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(payload.errors).map(([field, messages]) => [
      field,
      Array.isArray(messages) ? messages.map(String) : [String(messages)],
    ]),
  );
}

function authHeaders(token: string): HeadersInit {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await readPayload(response);

  if (!response.ok) {
    const errorPayload = asErrorPayload(payload);
    const message =
      typeof errorPayload?.message === "string"
        ? errorPayload.message
        : `Admin product request failed with status ${response.status}.`;

    throw new AdminProductsApiError(response.status, message, payload);
  }

  return payload as T;
}

async function readPayload(response: Response): Promise<unknown> {
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

function asErrorPayload(value: unknown): ApiErrorPayload | null {
  return typeof value === "object" && value !== null
    ? (value as ApiErrorPayload)
    : null;
}
