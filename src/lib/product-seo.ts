import { SITE_NAME } from "@/lib/seo";

const BRAND_PREFIX = /^enjoyful\s*life\s*/i;

function cleanText(value?: string): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function unbrandedProductName(name?: string): string {
  const cleanName = cleanText(name);
  return cleanName.replace(BRAND_PREFIX, "").trim() || cleanName;
}

export function brandedProductName(name?: string): string {
  const productName = unbrandedProductName(name);
  return productName ? `${SITE_NAME} ${productName}` : `${SITE_NAME} product`;
}

export function productImageAlt(name?: string, viewIndex = 0): string {
  const brandedName = brandedProductName(name);
  return viewIndex > 0
    ? `${brandedName} product view ${viewIndex + 1}`
    : `${brandedName} product image`;
}

export function productSeoTitle(name?: string, size?: string, customTitle?: string): string {
  const custom = cleanText(customTitle);
  // Some imported titles were cut mid-brand, for example "| enJoyful L".
  const hasTruncatedBrand = /\|\s*enjoyful(?:\s+l(?:i(?:f)?)?)?$/i.test(custom);
  if (custom && !hasTruncatedBrand) return custom;
  const sizeLabel = cleanText(size);
  return `${brandedProductName(name)}${sizeLabel ? ` ${sizeLabel}` : ""} | UAE`;
}

/** Use the same factual description in visible content and Product markup. */
export function productDescription(name?: string, size?: string, ...descriptions: (string | undefined)[]): string {
  const description = descriptions.map(cleanText).find(Boolean);
  if (description) return description;
  const sizeLabel = cleanText(size);
  return `${brandedProductName(name)}${sizeLabel ? `, ${sizeLabel}` : ""}. View product details and available options.`;
}

export function productSeoDescription(
  name?: string,
  size?: string,
  description?: string,
  customDescription?: string,
): string {
  const custom = cleanText(customDescription);
  if (custom) return custom;

  const sizeLabel = cleanText(size);
  const detail = cleanText(description);
  const lead = `Shop ${brandedProductName(name)}${sizeLabel ? ` ${sizeLabel}` : ""} online in the UAE.`;
  const full = `${lead}${detail ? ` ${detail}` : " Fast delivery across the United Arab Emirates."}`;
  if (full.length <= 160) return full;
  return `${full.slice(0, 157).replace(/\s+\S*$/, "")}...`;
}
