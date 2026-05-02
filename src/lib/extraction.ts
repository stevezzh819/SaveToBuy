import type { ExtractedProduct } from "./types";
import { cleanDomain, parsePriceValue } from "./utils";

export async function extractProductFromActiveTab(): Promise<ExtractedProduct | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) return null;

  const [{ result: isExtractorReady }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => typeof window.__SaveToBuy_extractProduct === "function"
  });

  if (!isExtractorReady) {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["assets/productExtractor.js"]
    });
  }

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.__SaveToBuy_extractProduct?.() ?? null
  });

  const extracted = result as Partial<ExtractedProduct> | null | undefined;
  if (!extracted) return null;

  const productUrl = extracted.productUrl || tab.url;
  const domain = extracted.domain || new URL(productUrl).hostname.replace(/^www\./, "");
  const brand = extracted.brand || cleanDomain(domain);
  const name = extracted.name || tab.title || "Untitled product";
  const priceText = extracted.priceText || "Price unknown";

  return {
    brand,
    name,
    priceText,
    priceValue: extracted.priceValue ?? parsePriceValue(priceText),
    currency: extracted.currency,
    shippingText: extracted.shippingText,
    imageUrl: extracted.imageUrl,
    productUrl,
    domain
  };
}
