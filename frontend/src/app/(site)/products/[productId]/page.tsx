import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailsPage from "@/components/user/product-details/ProductDetailsPage";
import {
  CatalogApiError,
  getCatalogProduct,
  getCatalogProducts,
} from "@/lib/catalog/catalogQueries";
import type { ProductDisplayItem } from "@/lib/catalog/catalogTypes";

export const dynamic = "force-dynamic";

type ProductDetailsRouteProps = {
  params: Promise<{
    productId: string;
  }>;
};

async function getSuggestedProducts(product: ProductDisplayItem) {
  const queries = [
    { category: product.category, perPage: 8, sort: "featured" as const },
    { perPage: 12, sort: "featured" as const },
  ];

  for (const query of queries) {
    try {
      const response = await getCatalogProducts(query);
      const suggestions = response.products
        .filter((candidate) => candidate.id !== product.id)
        .slice(0, 6);

      if (suggestions.length > 0) {
        return suggestions;
      }
    } catch {
      // Suggestions are optional; the product details page remains usable.
    }
  }

  return [];
}

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

  const suggestedProducts = await getSuggestedProducts(product);

  return (
    <ProductDetailsPage
      product={product}
      suggestedProducts={suggestedProducts}
    />
  );
}
