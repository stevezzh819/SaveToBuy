export type ProductStatus = "liked" | "unliked" | "waiting";

export interface ProductItem {
  id: string;
  brand: string;
  name: string;
  priceText: string;
  priceValue?: number;
  currency?: string;
  shippingText?: string;
  imageUrl?: string;
  productUrl: string;
  domain: string;
  status: ProductStatus;
  savedAt: string;
  notes?: string;
}

export type ExtractedProduct = Omit<ProductItem, "id" | "status" | "savedAt">;

export interface SaveResult {
  product: ProductItem;
  alreadySaved: boolean;
}
