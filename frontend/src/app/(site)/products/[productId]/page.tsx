import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailsPage from "@/components/user/product-details/ProductDetailsPage";
import {
  CatalogApiError,
  getCatalogProduct,
} from "@/lib/catalog/catalogQueries";
import type { ProductDisplayItem } from "@/lib/catalog/catalogTypes";

export const dynamic = "force-dynamic";

type ProductDetailsRouteProps = {
  params: Promise<{
    productId: string;
  }>;
};

export async function generateMetadata({
  params,
}: ProductDetailsRouteProps): Promise<Metadata> {
  const { productId } = await params;

  try {
    const { product } = await getCatalogProduct(productId);

    return {
      title: `${product.name} | ALD Motorshop`,
      description: product.description,
    };
  } catch {
    return {};
  }
}

export default async function ProductDetailsRoute({
  params,
}: ProductDetailsRouteProps) {
  const { productId } = await params;
  let product: ProductDisplayItem;

  try {
    ({ product } = await getCatalogProduct(productId));
  } catch (error) {
    if (error instanceof CatalogApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  return <ProductDetailsPage product={product} />;
}
