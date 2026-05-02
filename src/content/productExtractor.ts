import type { ExtractedProduct } from "../lib/types";

declare global {
  interface Window {
    __SaveToBuy_extractProduct?: () => ExtractedProduct | null;
  }
}

type JsonLdNode = Record<string, unknown>;

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  CAD: "$",
  AUD: "$",
  NZD: "$",
  SGD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  KRW: "₩"
};

function text(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number") return String(value);
  return undefined;
}

function cleanDomain(hostname: string): string {
  return hostname.replace(/^www\./, "").split(".")[0]?.replace(/[-_]/g, " ") || "unknown";
}

function parsePriceValue(priceText?: string): number | undefined {
  if (!priceText) return undefined;
  const match = priceText.replace(/,/g, "").match(/(\d+(?:\.\d{1,2})?)/);
  return match ? Number(match[1]) : undefined;
}

function absoluteUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value, window.location.href).href;
  } catch {
    return undefined;
  }
}

function meta(selector: string): string | undefined {
  return document.querySelector<HTMLMetaElement>(selector)?.content?.trim() || undefined;
}

function firstText(selectors: string[]): string | undefined {
  for (const selector of selectors) {
    const element = document.querySelector<HTMLElement>(selector);
    const value = element?.innerText?.replace(/\s+/g, " ").trim();
    if (value) return value;
  }
  return undefined;
}

function firstImage(selectors: string[]): string | undefined {
  for (const selector of selectors) {
    const element = document.querySelector<HTMLImageElement>(selector);
    const source = element?.currentSrc || element?.src || element?.getAttribute("data-src") || undefined;
    const url = absoluteUrl(source);
    if (url) return url;
  }
  return undefined;
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function flattenJsonLd(value: unknown): JsonLdNode[] {
  const nodes: JsonLdNode[] = [];

  function visit(node: unknown): void {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!node || typeof node !== "object") return;

    const object = node as JsonLdNode;
    nodes.push(object);

    if (object["@graph"]) visit(object["@graph"]);
    if (object.mainEntity) visit(object.mainEntity);
  }

  visit(value);
  return nodes;
}

function isProduct(node: JsonLdNode): boolean {
  return asArray(node["@type"])
    .map((value) => String(value).toLowerCase())
    .some((typeValue) => typeValue.includes("product"));
}

function getOffer(product: JsonLdNode): JsonLdNode | undefined {
  const offers = asArray(product.offers).filter((offer): offer is JsonLdNode => !!offer && typeof offer === "object");
  return offers[0];
}

function formatPrice(price: string, currency?: string): string {
  const trimmed = price.trim();
  if (!trimmed) return "";
  if (/[$€£¥₩]/.test(trimmed)) return currency ? `${trimmed} ${currency}` : trimmed;
  const symbol = currency ? CURRENCY_SYMBOLS[currency.toUpperCase()] : undefined;
  return `${symbol ?? ""}${trimmed}${currency ? ` ${currency}` : ""}`.trim();
}

function getJsonLdProduct(): Partial<ExtractedProduct> {
  const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'));

  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script.textContent || "{}");
      const product = flattenJsonLd(parsed).find(isProduct);
      if (!product) continue;

      const offer = getOffer(product);
      const brandNode = product.brand;
      const brand = typeof brandNode === "object" && brandNode ? text((brandNode as JsonLdNode).name) : text(brandNode);
      const images = asArray(product.image).map(text).filter(Boolean) as string[];
      const price = text(offer?.price ?? offer?.lowPrice);
      const currency = text(offer?.priceCurrency);
      const shipping = asArray(offer?.shippingDetails)
        .map((detail) => {
          if (!detail || typeof detail !== "object") return undefined;
          const rate = (detail as JsonLdNode).shippingRate;
          if (rate && typeof rate === "object") {
            const amount = text((rate as JsonLdNode).value);
            const rateCurrency = text((rate as JsonLdNode).currency) || currency;
            return amount ? formatPrice(amount, rateCurrency) : undefined;
          }
          return undefined;
        })
        .find(Boolean);

      return {
        name: text(product.name),
        brand,
        priceText: price ? formatPrice(price, currency) : undefined,
        priceValue: parsePriceValue(price),
        currency,
        shippingText: shipping,
        imageUrl: absoluteUrl(images[0])
      };
    } catch {
      continue;
    }
  }

  return {};
}

function getMetaProduct(): Partial<ExtractedProduct> {
  const amount = meta('meta[property="product:price:amount"]') || meta('meta[name="twitter:data1"]');
  const currency = meta('meta[property="product:price:currency"]');
  return {
    name: meta('meta[property="og:title"]') || meta('meta[name="twitter:title"]'),
    brand: meta('meta[property="og:site_name"]') || meta('meta[name="application-name"]'),
    priceText: amount ? formatPrice(amount, currency) : undefined,
    priceValue: parsePriceValue(amount),
    currency,
    imageUrl: absoluteUrl(meta('meta[property="og:image"]') || meta('meta[name="twitter:image"]')),
    productUrl: absoluteUrl(meta('meta[property="og:url"]'))
  };
}

function getSelectorProduct(): Partial<ExtractedProduct> {
  const name = firstText([
    "h1",
    '[class*="product-title" i]',
    '[class*="ProductTitle"]',
    '[class*="product-name" i]',
    '[data-testid*="product-title" i]'
  ]);
  const priceText = firstText(['[data-testid*="price" i]', '[class*="price" i]', '[class*="Price"]']);
  const brand = firstText(['[data-testid*="brand" i]', '[class*="brand" i]', '[class*="Brand"]']);
  const shippingText = firstText(['[data-testid*="shipping" i]', '[class*="shipping" i]', '[class*="Shipping"]']);

  return {
    name,
    brand,
    priceText,
    priceValue: parsePriceValue(priceText),
    shippingText,
    imageUrl: absoluteUrl(meta('meta[property="og:image"]')) || firstImage(["main img", '[class*="product" i] img'])
  };
}

function mergeProducts(...sources: Partial<ExtractedProduct>[]): Partial<ExtractedProduct> {
  return sources.reduce<Partial<ExtractedProduct>>((merged, source) => {
    for (const [key, value] of Object.entries(source) as [keyof ExtractedProduct, ExtractedProduct[keyof ExtractedProduct]][]) {
      if (value !== undefined && value !== "" && merged[key] === undefined) {
        Object.assign(merged, { [key]: value });
      }
    }
    return merged;
  }, {});
}

function extractProduct(): ExtractedProduct | null {
  const pageUrl = window.location.href;
  const domain = window.location.hostname.replace(/^www\./, "");
  const extracted = mergeProducts(getJsonLdProduct(), getMetaProduct(), getSelectorProduct());
  const name = extracted.name || document.title.replace(/\s+\|.*$/, "").trim();

  if (!name && !extracted.priceText && !extracted.imageUrl) return null;

  return {
    brand: extracted.brand || cleanDomain(domain),
    name: name || "Untitled product",
    priceText: extracted.priceText || "Price unknown",
    priceValue: extracted.priceValue ?? parsePriceValue(extracted.priceText),
    currency: extracted.currency,
    shippingText: extracted.shippingText,
    imageUrl: extracted.imageUrl,
    productUrl: extracted.productUrl || pageUrl,
    domain
  };
}

window.__SaveToBuy_extractProduct = extractProduct;
