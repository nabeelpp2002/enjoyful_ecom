import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";
import { resolveProduct } from "@/lib/products-server";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resolved = await resolveProduct(id);
  if (!resolved) notFound();

  return (
    <ProductDetailClient
      product={resolved.product}
      initialSizeVariants={resolved.variants}
      relatedProducts={resolved.relatedProducts}
    />
  );
}
