import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ApiError } from '@/lib/api/client';
import { getProducts } from '@/lib/catalog/api';
import type {
  CatalogProduct,
  ProductFilters,
  ProductPage,
} from '@/lib/catalog/types';

type CatalogError = ApiError | Error;

type UseProductCatalogOptions = {
  filters?: ProductFilters;
  perPage?: number;
};

type ProductCatalogState = {
  error: CatalogError | null;
  hasNextPage: boolean;
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  page: number;
  paginationError: CatalogError | null;
  products: CatalogProduct[];
};

function mergeProducts(
  existingProducts: CatalogProduct[],
  nextProducts: CatalogProduct[],
) {
  const productsById = new Map(
    existingProducts.map((product) => [product.id, product]),
  );

  nextProducts.forEach((product) => {
    productsById.set(product.id, product);
  });

  return Array.from(productsById.values());
}

function isCancelled(error: unknown) {
  return error instanceof ApiError && error.kind === 'cancelled';
}

function getError(value: unknown) {
  return value instanceof Error
    ? value
    : new Error('The product catalog could not be loaded.');
}

export function useProductCatalog({
  filters = {},
  perPage = 20,
}: UseProductCatalogOptions = {}) {
  const normalizedFilters = useMemo(
    () => ({
      brand: filters.brand?.trim() || undefined,
      category: filters.category?.trim() || undefined,
      search: filters.search?.trim() || undefined,
      sort: filters.sort,
    }),
    [filters.brand, filters.category, filters.search, filters.sort],
  );
  const [state, setState] = useState<ProductCatalogState>({
    error: null,
    hasNextPage: true,
    isInitialLoading: true,
    isLoadingMore: false,
    isRefreshing: false,
    page: 0,
    paginationError: null,
    products: [],
  });
  const requestVersion = useRef(0);
  const activeController = useRef<AbortController | null>(null);
  const loadingMore = useRef(false);

  const loadFirstPage = useCallback(
    async (refresh = false) => {
      const version = requestVersion.current + 1;
      requestVersion.current = version;
      activeController.current?.abort();

      const controller = new AbortController();
      activeController.current = controller;

      setState((current) => ({
        ...current,
        error: null,
        hasNextPage: true,
        isInitialLoading: !refresh,
        isLoadingMore: false,
        isRefreshing: refresh,
        page: refresh ? current.page : 0,
        paginationError: null,
        products: refresh ? current.products : [],
      }));
      loadingMore.current = false;

      try {
        const response = await getProducts({
          ...normalizedFilters,
          page: 1,
          perPage,
          signal: controller.signal,
        });

        if (requestVersion.current !== version) {
          return;
        }

        setState({
          error: null,
          hasNextPage: response.meta.currentPage < response.meta.lastPage,
          isInitialLoading: false,
          isLoadingMore: false,
          isRefreshing: false,
          page: response.meta.currentPage,
          paginationError: null,
          products: response.products,
        });
      } catch (error) {
        if (requestVersion.current !== version || isCancelled(error)) {
          return;
        }

        setState((current) => ({
          ...current,
          error: getError(error),
          isInitialLoading: false,
          isRefreshing: false,
        }));
      }
    },
    [normalizedFilters, perPage],
  );

  useEffect(() => {
    const debounceMs = normalizedFilters.search ? 350 : 0;
    const timeout = setTimeout(() => {
      void loadFirstPage();
    }, debounceMs);

    return () => {
      clearTimeout(timeout);
      requestVersion.current += 1;
      activeController.current?.abort();
    };
  }, [loadFirstPage, normalizedFilters.search]);

  const loadMore = useCallback(async () => {
    if (
      loadingMore.current ||
      state.isInitialLoading ||
      state.isRefreshing ||
      !state.hasNextPage
    ) {
      return;
    }

    loadingMore.current = true;
    const version = requestVersion.current;
    const controller = new AbortController();
    activeController.current = controller;

    setState((current) => ({
      ...current,
      isLoadingMore: true,
      paginationError: null,
    }));

    try {
      const response: ProductPage = await getProducts({
        ...normalizedFilters,
        page: state.page + 1,
        perPage,
        signal: controller.signal,
      });

      if (requestVersion.current !== version) {
        return;
      }

      setState((current) => ({
        ...current,
        hasNextPage: response.meta.currentPage < response.meta.lastPage,
        isLoadingMore: false,
        page: response.meta.currentPage,
        paginationError: null,
        products: mergeProducts(current.products, response.products),
      }));
    } catch (error) {
      if (requestVersion.current === version && !isCancelled(error)) {
        setState((current) => ({
          ...current,
          isLoadingMore: false,
          paginationError: getError(error),
        }));
      }
    } finally {
      loadingMore.current = false;

      if (activeController.current === controller) {
        activeController.current = null;
      }
    }
  }, [normalizedFilters, perPage, state]);

  const retry = useCallback(() => {
    void loadFirstPage(state.products.length > 0);
  }, [loadFirstPage, state.products.length]);

  const refresh = useCallback(() => {
    if (state.isRefreshing || state.isInitialLoading) {
      return;
    }

    void loadFirstPage(true);
  }, [loadFirstPage, state.isInitialLoading, state.isRefreshing]);

  return {
    ...state,
    loadMore,
    refresh,
    retry,
  };
}
