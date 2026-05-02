import { ExternalLink, Heart, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { deleteProduct, getProducts, updateProductStatus } from "../lib/storage";
import type { ProductItem, ProductStatus } from "../lib/types";
import { formatSavedDate } from "../lib/utils";

type Filter = "all" | ProductStatus;
type SortMode = "newest" | "price-low" | "price-high";

const filters: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Liked", value: "liked" },
  { label: "Unliked", value: "unliked" },
  { label: "Waiting List", value: "waiting" }
];

const statuses: { label: string; value: ProductStatus }[] = [
  { label: "Liked", value: "liked" },
  { label: "Unliked", value: "unliked" },
  { label: "Waiting", value: "waiting" }
];

export function Closet() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products
      .filter((product) => (filter === "all" ? true : product.status === filter))
      .filter((product) => {
        if (!normalizedQuery) return true;
        return `${product.brand} ${product.name}`.toLowerCase().includes(normalizedQuery);
      })
      .sort((left, right) => {
        if (sortMode === "price-low") return (left.priceValue ?? Number.POSITIVE_INFINITY) - (right.priceValue ?? Number.POSITIVE_INFINITY);
        if (sortMode === "price-high") return (right.priceValue ?? Number.NEGATIVE_INFINITY) - (left.priceValue ?? Number.NEGATIVE_INFINITY);
        return new Date(right.savedAt).getTime() - new Date(left.savedAt).getTime();
      });
  }, [filter, products, query, sortMode]);

  async function setStatus(id: string, status: ProductStatus) {
    await updateProductStatus(id, status);
    setProducts((current) => current.map((product) => (product.id === id ? { ...product, status } : product)));
  }

  async function removeProduct(id: string) {
    await deleteProduct(id);
    setProducts((current) => current.filter((product) => product.id !== id));
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-ink">
      <header className="border-b border-line bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-6 sm:px-8">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">SaveToBuy</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-normal">My Closet</h1>
            </div>
            <p className="text-sm text-muted">{products.length} saved {products.length === 1 ? "item" : "items"}</p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                className="h-11 w-full rounded-full border border-line bg-white pl-10 pr-10 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
                placeholder="Search brand or product"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {query ? (
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink" onClick={() => setQuery("")} aria-label="Clear search">
                  <X size={16} />
                </button>
              ) : null}
            </label>

            <div className="flex rounded-full border border-line bg-white p-1">
              {filters.map((item) => (
                <button
                  key={item.value}
                  className={`h-9 rounded-full px-4 text-sm font-medium transition ${
                    filter === item.value ? "bg-accent text-white" : "text-muted hover:text-ink"
                  }`}
                  onClick={() => setFilter(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <select
              className="h-11 rounded-full border border-line bg-white px-4 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
            >
              <option value="newest">Newest saved</option>
              <option value="price-low">Price low to high</option>
              <option value="price-high">Price high to low</option>
            </select>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {visibleProducts.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} onStatus={setStatus} onDelete={removeProduct} />
            ))}
          </div>
        ) : (
          <div className="grid min-h-[46vh] place-items-center rounded-3xl border border-dashed border-line bg-white px-6 text-center">
            <div>
              <Heart className="mx-auto mb-4 text-accent" size={32} />
              <h2 className="text-lg font-semibold">No clothes saved yet.</h2>
              <p className="mt-2 max-w-md text-sm text-muted">Browse a product page and click Save to Closet.</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function ProductCard({
  product,
  onStatus,
  onDelete
}: {
  product: ProductItem;
  onStatus: (id: string, status: ProductStatus) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_10px_34px_rgba(17,24,39,0.06)]">
      <div className="aspect-[4/5] bg-slate-100">
        {product.imageUrl ? (
          <img className="h-full w-full object-cover" src={product.imageUrl} alt="" />
        ) : (
          <div className="grid h-full place-items-center text-sm text-muted">No image</div>
        )}
      </div>

      <div className="space-y-4 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{product.brand}</p>
          <h2 className="mt-1 line-clamp-2 min-h-10 text-base font-semibold">{product.name}</h2>
          <div className="mt-3 space-y-1 text-sm text-muted">
            <p className="font-semibold text-ink">{product.priceText}</p>
            <p>{product.shippingText || "Shipping unknown"}</p>
            <p>{product.domain}</p>
            <p>Saved {formatSavedDate(product.savedAt)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 rounded-full bg-slate-100 p-1">
          {statuses.map((status) => (
            <button
              key={status.value}
              className={`h-8 rounded-full text-xs font-semibold transition ${
                product.status === status.value ? "bg-white text-accent shadow-sm" : "text-muted hover:text-ink"
              }`}
              onClick={() => onStatus(product.id, status.value)}
            >
              {status.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <a
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-accent px-3 text-sm font-semibold text-white transition hover:bg-[#098d0d]"
            href={product.productUrl}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={15} />
            Open Product
          </a>
          <button
            className="grid h-10 w-10 place-items-center rounded-full border border-line text-muted transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            onClick={() => onDelete(product.id)}
            aria-label={`Delete ${product.name}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
