import type { Metadata } from "next";
import type { ReactNode } from "react";
import { resolveProduct } from "@/lib/products-server";

// Raw API images can be objects {url,publicId,alt,isPrimary} or strings.
type RawImage = { url?: string } | string;

interface Product {
  _id?: string;
  name?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  // API returns [{url,publicId,alt,isPrimary}], not string[]
  images?: RawImage[];
  image?: string;
  hoverImage?: string;
  brand?: string;
  productCode?: string;
  size?: string;
  price?: number;
  currency?: string;
  stock?: number;
  rating?: number;
  reviews?: number;
  isHidden?: boolean;
}

/** Always returns a plain URL string regardless of raw image shape. */
function toImageUrl(img?: RawImage): string | undefined {
  if (!img) return undefined;
  if (typeof img === 'string') return img || undefined;
  return img.url || undefined;
}

async function getProduct(id: string): Promise<Product | null> {
  try {
    const resolved = await resolveProduct(id);
    return resolved?.rawProduct as Product ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Product | Enjoyful Life",
    };
  }

  const sizeLabel = product.size ? ` | ${product.size}` : "";
  const title = `${product.name}${sizeLabel} | Enjoyful Life UAE`;
  const rawDescription = product.shortDescription ?? product.description ?? "";
  const description = rawDescription.slice(0, 160);
  const canonical = `https://enjoyfullife.com/product/${product.slug ?? id}`;
  // images from the API are objects {url,publicId,...} — extract the URL string
  const imageUrl = toImageUrl(product.images?.[0]) ?? product.image;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: imageUrl ? [{ url: imageUrl, alt: product.name ?? "" }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  // Extract URL strings from raw image objects before embedding in JSON-LD
  const imageUrls = (product?.images ?? [])
    .map((img) => toImageUrl(img))
    .filter((u): u is string => Boolean(u));

  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.shortDescription ?? product.description,
        image: imageUrls.length > 0 ? imageUrls : [product.image].filter(Boolean),
        brand: {
          "@type": "Brand",
          name: "Enjoyful Life",
        },
        sku: product.productCode,
        offers: {
          "@type": "Offer",
          priceCurrency: product.currency ?? "AED",
          price: product.price,
          availability:
            (product.stock ?? 0) > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          url: `https://enjoyfullife.com/product/${product.slug ?? id}`,
        },
        // API fields: rating (number 0-5), reviews (count)
        ...(product.reviews && product.reviews > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: product.rating,
                reviewCount: product.reviews,
              },
            }
          : {}),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
