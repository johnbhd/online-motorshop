export type AdminProduct = {
  id: number;
  part_number: string;
  name: string;
  description: string | null;
  brand: string;
  category_id: number | null;
  category: string | null;
  brand_id: number | null;
  price: number;
  img_url: string;
  availability_status: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
};

export type AdminProductCategoryOption = {
  id: number;
  name: string;
};

export type AdminProductBrandOption = {
  id: number;
  name: string;
};

export type AdminProductsResponse = {
  summary: {
    total: number;
    active: number;
    inactive: number;
    inventory_tracked: false;
  };
  filters: {
    brands: string[];
    brand_options: AdminProductBrandOption[];
    categories: AdminProductCategoryOption[];
    statuses: string[];
    availability_statuses: string[];
  };
  products: AdminProduct[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type AdminProductPayload = Omit<
  AdminProduct,
  "id" | "category" | "brand" | "created_at" | "updated_at"
>;

export type AdminProductDetailsResponse = {
  product: AdminProduct;
};

export type AdminProductMutationResponse = {
  message: string;
  product: AdminProduct;
};

export type AdminProductDeleteResponse = {
  message: string;
};
