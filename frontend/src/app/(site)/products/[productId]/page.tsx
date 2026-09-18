import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailsPage from "@/components/user/product-details/ProductDetailsPage";
import { getProductById } from "@/components/user/products/productsData";

type ProductDetailsRouteProps = {
  params: Promise<{
    productId: string;
  }>;
};

export async function generateMetadata({
  params,
}: ProductDetailsRouteProps): Promise<Metadata> {
  const { productId } = await params;
  const product = getProductById(productId);

  if (!product) {
    return {};
  }

  return {
    title: `${product.name} | ALD Motorshop`,
    description: product.description,
  };
}

export default async function ProductDetailsRoute({
  params,
}: ProductDetailsRouteProps) {
  const { productId } = await params;
  const product = getProductById(productId);

  if (!product) {
    notFound();
  }

  return <ProductDetailsPage product={product} />;
}
