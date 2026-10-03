import type { AdminProductsResponse } from "./adminProductsTypes";

export type AdminTaxonomyRecord = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  product_count: number;
  created_at: string | null;
  updated_at: string | null;
};

export type AdminCategory = AdminTaxonomyRecord;
export type AdminBrand = AdminTaxonomyRecord;

export type AdminTaxonomyPayload = {
  name: string;
  description: string | null;
  status: string;
};

export type AdminCategoriesResponse = {
  categories: AdminCategory[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type AdminBrandsResponse = {
  brands: AdminBrand[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type AdminTaxonomyMutationResponse = {
  message: string;
  category?: AdminCategory;
  brand?: AdminBrand;
};

export type AdminTaxonomyProductsResponse = AdminProductsResponse;
