import ProductsPage from "@/components/user/products/ProductsPage";

type ProductsRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProductsRoute({
  searchParams,
}: ProductsRouteProps) {
  const params = await searchParams;
  const categoryParam = params.category;
  const initialCategory = Array.isArray(categoryParam)
    ? categoryParam[0]
    : categoryParam;

  return <ProductsPage initialCategory={initialCategory} />;
}
