import { ApiError, apiRequest } from '@/lib/api/client';

import type {
  CatalogBranch,
  CatalogCategory,
  CatalogProduct,
  ProductPage,
  ProductQuery,
} from './types';

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null;
}

function asNullableString(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function asNullableNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asNumber(value: unknown, fallback = 0) {
  const number = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function responseError(message: string) {
  return new ApiError(message, { kind: 'http' });
}

function mapProduct(value: unknown): CatalogProduct {
  if (!isRecord(value)) {
    throw responseError('The product response was invalid.');
  }

  return {
    availabilityStatus: asNullableString(value.availability_status),
    brand: asNullableString(value.brand),
    brandId: asNullableNumber(value.brand_id),
    category: asNullableString(value.category),
    categoryId: asNullableNumber(value.category_id),
    description: asNullableString(value.description),
    id: asNumber(value.id),
    imageUrl: asNullableString(value.img_url),
    name: asString(value.name, 'Unnamed product'),
    partNumber: asString(value.part_number),
    price: asNumber(value.price),
    status: asString(value.status),
  };
}

function mapPagination(value: unknown): ProductPage['meta'] {
  if (!isRecord(value)) {
    throw responseError('The product pagination response was invalid.');
  }

  return {
    currentPage: asNumber(value.current_page, 1),
    lastPage: asNumber(value.last_page, 1),
    perPage: asNumber(value.per_page, 0),
    total: asNumber(value.total, 0),
  };
}

function buildProductQuery(query: ProductQuery) {
  const params = new URLSearchParams();

  if (query.page) {
    params.set('page', String(query.page));
  }

  if (query.perPage) {
    params.set('per_page', String(query.perPage));
  }

  const search = query.search?.trim();

  if (search) {
    params.set('search', search);
  }

  if (query.brand?.trim()) {
    params.set('brand', query.brand.trim());
  }

  if (query.category?.trim()) {
    params.set('category', query.category.trim());
  }

  if (query.sort) {
    params.set('sort', query.sort);
  }

  const queryString = params.toString();

  return queryString ? `/api/products?${queryString}` : '/api/products';
}

export async function getProducts(query: ProductQuery = {}): Promise<ProductPage> {
  const payload = await apiRequest<unknown>(buildProductQuery(query), {
    signal: query.signal,
  });

  if (!isRecord(payload) || !Array.isArray(payload.products)) {
    throw responseError('The products response was invalid.');
  }

  return {
    meta: mapPagination(payload.meta),
    products: payload.products.map(mapProduct),
  };
}

export async function getProduct(identifier: string, signal?: AbortSignal) {
  const payload = await apiRequest<unknown>(
    `/api/products/${encodeURIComponent(identifier)}`,
    { signal },
  );

  if (!isRecord(payload) || !payload.product) {
    throw responseError('The product response was invalid.');
  }

  return mapProduct(payload.product);
}

export async function getCategories(signal?: AbortSignal): Promise<CatalogCategory[]> {
  const payload = await apiRequest<unknown>('/api/categories', { signal });

  if (!isRecord(payload) || !Array.isArray(payload.categories)) {
    throw responseError('The categories response was invalid.');
  }

  return payload.categories.map((value) => {
    if (!isRecord(value)) {
      throw responseError('The categories response was invalid.');
    }

    return {
      description: asNullableString(value.description),
      id: asNumber(value.id),
      name: asString(value.name, 'Unnamed category'),
      status: asString(value.status),
    };
  });
}

export async function getBranches(signal?: AbortSignal): Promise<CatalogBranch[]> {
  const payload = await apiRequest<unknown>('/api/branches', { signal });

  if (!isRecord(payload) || !Array.isArray(payload.branches)) {
    throw responseError('The branches response was invalid.');
  }

  return payload.branches.map((value) => {
    if (!isRecord(value)) {
      throw responseError('The branches response was invalid.');
    }

    return {
      address: asNullableString(value.address),
      contactNumber: asNullableString(value.contact_number),
      id: asNumber(value.id),
      name: asString(value.name, 'Unnamed branch'),
      pickupAvailable: value.pickup_available === true,
      status: asString(value.status),
    };
  });
}
