import type { ProductItem, ProductStatus, SaveResult } from "./types";

const PRODUCTS_KEY = "savetobuy.products";

function storageGet<T>(key: string): Promise<T | undefined> {
  return chrome.storage.local.get(key).then((result) => result[key] as T | undefined);
}

function storageSet<T>(key: string, value: T): Promise<void> {
  return chrome.storage.local.set({ [key]: value });
}

export async function getProducts(): Promise<ProductItem[]> {
  return (await storageGet<ProductItem[]>(PRODUCTS_KEY)) ?? [];
}

export async function saveProduct(product: ProductItem, updateExisting = true): Promise<SaveResult> {
  const products = await getProducts();
  const existingIndex = products.findIndex((item) => item.productUrl === product.productUrl);

  if (existingIndex >= 0) {
    if (updateExisting) {
      const existing = products[existingIndex];
      products[existingIndex] = {
        ...existing,
        ...product,
        id: existing.id,
        status: existing.status,
        savedAt: existing.savedAt
      };
      await storageSet(PRODUCTS_KEY, products);
      return { product: products[existingIndex], alreadySaved: true };
    }

    return { product: products[existingIndex], alreadySaved: true };
  }

  const nextProducts = [product, ...products];
  await storageSet(PRODUCTS_KEY, nextProducts);
  return { product, alreadySaved: false };
}

export async function updateProductStatus(id: string, status: ProductStatus): Promise<void> {
  const products = await getProducts();
  await storageSet(
    PRODUCTS_KEY,
    products.map((product) => (product.id === id ? { ...product, status } : product))
  );
}

export async function deleteProduct(id: string): Promise<void> {
  const products = await getProducts();
  await storageSet(
    PRODUCTS_KEY,
    products.filter((product) => product.id !== id)
  );
}

export async function clearProducts(): Promise<void> {
  await storageSet(PRODUCTS_KEY, []);
}
