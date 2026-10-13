import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  brandedProductName,
  productImageAlt,
  productSeoDescription,
  productSeoTitle,
  unbrandedProductName,
} from "@/lib/product-seo";
import { resolveProduct } from "@/lib/products-server";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_ALT,
  pageMetadata,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";

export const revalidate = 300;

type RawImage = { url?: string; alt?: string; isPrimary?: boolean } | string;

interface Product {
  _id?: string;
  name?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  metaDescription?: string;
  seoTitle?: string;
  images?: RawImage[];
  image?: string;
  hoverImage?: string;
  brand?: string;
  productCode?: string;
  skuCode?: string;
  productFamily?: string;
  size?: string;
  price?: number;
  currency?: string;
  stock?: number;
  rating?: number;
  reviews?: number;
  isHidden?: boolean;
  barcode?: string;
  countryOfOrigin?: string;
  category?: string | { name?: string; slug?: string };
}

function toImageUrl(img?: RawImage): string | undefined {
  if (!img) return undefined;
  if (typeof img === "string") return img || undefined;
  return img.url || undefined;
}

function toImageAlt(img?: RawImage): string | undefined {
  if (!img || typeof img === "string") return undefined;
  return img.alt?.trim() || undefined;
}

async function getProduct(id: string): Promise<Product | null> {
  try {
    const resolved = await resolveProduct(id);
    return (resolved?.rawProduct as Product) ?? null;
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
    return pageMetadata({
      title: "Product Not Found | Enjoyful Life",
      description: DEFAULT_DESCRIPTION,
      path: `/product/${id}`,
      index: false,
    });
  }

  const title = productSeoTitle(product.name, product.size, product.seoTitle);
  const description = productSeoDescription(
    product.name,
    product.size,
    product.shortDescription ?? product.description,
    product.metaDescription,
  );
  const canonicalIdentifier = product.productFamily || product.slug || id;
  const productPath = `/product/${canonicalIdentifier}`;
  const canonical = `${SITE_URL}${productPath}`;
  const primaryImage = product.images?.find(
    (image) => typeof image !== "string" && image.isPrimary,
  ) ?? product.images?.[0];
  const imageUrl = toImageUrl(primaryImage) ?? product.image;
  const imageAlt = toImageAlt(primaryImage) ?? productImageAlt(product.name);

  const baseMetadata = pageMetadata({
    title,
    description,
    path: productPath,
    index: product.isHidden !== true,
  });

  return {
    ...baseMetadata,
    openGraph: {
      ...baseMetadata.openGraph,
      type: "website",
      title,
      description,
      url: canonical,
      images: [
        imageUrl
          ? { url: imageUrl, alt: imageAlt }
          : { url: DEFAULT_OG_IMAGE, alt: DEFAULT_OG_IMAGE_ALT },
      ],
    },
    twitter: {
      ...baseMetadata.twitter,
      card: "summary_large_image",
      title,
      description,
      images: [
        imageUrl
          ? { url: imageUrl, alt: imageAlt }
          : { url: DEFAULT_OG_IMAGE, alt: DEFAULT_OG_IMAGE_ALT },
      ],
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
  const canonicalIdentifier = product?.productFamily || product?.slug || id;
  const canonicalUrl = `${SITE_URL}/product/${canonicalIdentifier}`;
  const imageUrls = (product?.images ?? [])
    .map((image) => toImageUrl(image))
    .filter((url): url is string => Boolean(url));
  const categoryName = typeof product?.category === "string"
    ? product.category
    : product?.category?.name;
  const validBarcode = /^\d{13}$/.test(product?.barcode ?? "") ? product?.barcode : undefined;
  const canPurchase = Boolean(product && product.isHidden !== true && product.price && product.price > 0);
  const hasValidRating = Boolean(
    product?.reviews && product.reviews > 0 && product.rating && product.rating > 0 && product.rating <= 5,
  );

  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        "@id": `${canonicalUrl}#product`,
        url: canonicalUrl,
        name: unbrandedProductName(product.name),
        alternateName: brandedProductName(product.name),
        description: productSeoDescription(
          product.name,
          product.size,
          product.shortDescription ?? product.description,
          product.metaDescription,
        ),
        image: imageUrls.length > 0 ? imageUrls : [product.image].filter(Boolean),
        brand: {
          "@type": "Brand",
          name: SITE_NAME,
        },
        category: categoryName,
        sku: product.skuCode || product.productCode,
        mpn: product.productCode,
        gtin13: validBarcode,
        ...(product.size
          ? {
              additionalProperty: {
                "@type": "PropertyValue",
                name: "Size",
                value: product.size,
              },
            }
          : {}),
        ...(canPurchase
          ? {
              offers: {
                "@type": "Offer",
                priceCurrency: product.currency ?? "AED",
                price: product.price,
                availability: "https://schema.org/InStock",
                itemCondition: "https://schema.org/NewCondition",
                url: canonicalUrl,
                seller: { "@id": `${SITE_URL}/#organization` },
              },
            }
          : {}),
        ...(hasValidRating
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

  const breadcrumbJsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: unbrandedProductName(product.name),
            item: canonicalUrl,
          },
        ],
      }
    : null;

  return (
    <>
      {jsonLd && <JsonLd data={breadcrumbJsonLd ? [jsonLd, breadcrumbJsonLd] : jsonLd} />}
      {children}
    </>
  );
}
