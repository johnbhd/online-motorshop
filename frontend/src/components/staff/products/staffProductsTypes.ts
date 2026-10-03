export type StaffProduct = {
  id: number;
  part_number: string;
  name: string;
  description: string | null;
  brand: string;
  category_id: number | null;
  category: string | null;
  price: number;
  img_url: string | null;
  availability_status: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  inventory: null;
};

export type StaffProductsSummary = {
  total: number;
  active: number;
  inactive: number;
  inventory_tracked: boolean;
};

export type StaffProductCategoryOption = {
  id: number;
  name: string;
};

export type StaffProductsFilters = {
  brands: string[];
  categories: StaffProductCategoryOption[];
  statuses: string[];
  availability_statuses: string[];
};

export type StaffProductsMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type StaffProductsResponse = {
  summary: StaffProductsSummary;
  filters: StaffProductsFilters;
  products: StaffProduct[];
  meta: StaffProductsMeta;
};

export type StaffProductDetailsResponse = {
  product: StaffProduct;
};
