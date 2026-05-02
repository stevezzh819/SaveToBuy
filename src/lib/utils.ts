import type { ExtractedProduct, ProductItem } from "./types";

export function cleanDomain(hostname: string): string {
  return hostname.replace(/^www\./, "").split(".")[0]?.replace(/[-_]/g, " ") || "unknown";
}

export function displayDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown source";
  }
}

export function makeProductId(productUrl: string): string {
  const source = productUrl.trim().toLowerCase();
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash << 5) - hash + source.charCodeAt(index);
    hash |= 0;
  }
  return `product-${Math.abs(hash)}`;
}

export function parsePriceValue(priceText?: string): number | undefined {
  if (!priceText) return undefined;
  const match = priceText.replace(/,/g, "").match(/(\d+(?:\.\d{1,2})?)/);
  return match ? Number(match[1]) : undefined;
}

export function normalizeProduct(product: ExtractedProduct): ProductItem {
  const now = new Date().toISOString();
  const priceValue = product.priceValue ?? parsePriceValue(product.priceText);

  return {
    ...product,
    id: makeProductId(product.productUrl),
    brand: product.brand.trim() || cleanDomain(product.domain),
    name: product.name.trim() || "Untitled product",
    priceText: product.priceText.trim() || "Price unknown",
    priceValue,
    status: "unliked",
    savedAt: now
  };
}

export function formatSavedDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}
