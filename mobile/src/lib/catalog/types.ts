export type ProductSort = 'price_asc' | 'price_desc';

export type ProductFilters = {
  brand?: string;
  category?: string;
  search?: string;
  sort?: ProductSort;
};

export type ProductQuery = ProductFilters & {
  page?: number;
  perPage?: number;
  signal?: AbortSignal;
};

export type CatalogProduct = {
  availabilityStatus: string | null;
  brand: string | null;
  brandId: number | null;
  category: string | null;
  categoryId: number | null;
  description: string | null;
  id: number;
  imageUrl: string | null;
  name: string;
  partNumber: string;
  price: number;
  status: string;
};

export type CatalogPagination = {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
};

export type ProductPage = {
  meta: CatalogPagination;
  products: CatalogProduct[];
};

export type CatalogCategory = {
  description: string | null;
  id: number;
  name: string;
  status: string;
};

export type CatalogBranch = {
  address: string | null;
  contactNumber: string | null;
  id: number;
  name: string;
  pickupAvailable: boolean;
  status: string;
};
