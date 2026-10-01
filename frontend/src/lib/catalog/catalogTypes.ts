export type CatalogApiProduct = {
  id: number;
  part_number: string;
  name: string;
  description: string | null;
  brand: string;
  category_id: number | null;
  category: string | null;
  price: number | string;
  img_url: string | null;
  availability_status: string;
  status: string;
};

export type CatalogProduct = {
  id: string;
  databaseId: number;
  partNumber: string;
  name: string;
  description: string;
  brand: string;
  categoryId: number | null;
  category: string;
  price: number;
  image: string;
  alt: string;
  availabilityStatus: string;
  status: string;
};

export type ProductDisplayItem = CatalogProduct;

export type ProductBrand = string;
export type ProductCategory = string;
export type ProductAvailability = "Listed";

export type ProductFilterState = {
  brands: ProductBrand[];
  categories: ProductCategory[];
  availability: ProductAvailability[];
  minPrice: number;
  maxPrice: number;
};

export type CatalogPaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type CatalogProductsResponse = {
  products: CatalogApiProduct[];
  meta: CatalogPaginationMeta;
};

export type CatalogProductResponse = {
  product: CatalogApiProduct;
};

export type CatalogProductsResult = {
  products: ProductDisplayItem[];
  meta: CatalogPaginationMeta;
};

export type CatalogProductResult = {
  product: ProductDisplayItem;
};

export type CatalogCategory = {
  id: number;
  name: string;
  description: string | null;
  status: string;
};

export type CatalogBranch = {
  id: number;
  name: string;
  address: string;
  contact_number: string | null;
  pickup_available: boolean;
  status: string;
};

export type CatalogCategoriesResponse = {
  categories: CatalogCategory[];
};

export type CatalogBranchesResponse = {
  branches: CatalogBranch[];
};

export type CatalogRequestOptions = {
  search?: string;
  brand?: string;
  category?: string;
  sort?: "featured" | "price-asc" | "price-desc";
  page?: number;
  perPage?: number;
  signal?: AbortSignal;
};

export const DEFAULT_PRODUCT_MAX_PRICE = 10000;

export const productAvailability: ProductAvailability[] = ["Listed"];

export const initialProductFilters: ProductFilterState = {
  brands: [],
  categories: [],
  availability: [],
  minPrice: 0,
  maxPrice: DEFAULT_PRODUCT_MAX_PRICE,
};
