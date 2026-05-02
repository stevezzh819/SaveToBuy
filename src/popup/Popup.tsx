import { ExternalLink, Loader2, Save, Shirt } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { extractProductFromActiveTab } from "../lib/extraction";
import { saveProduct } from "../lib/storage";
import type { ExtractedProduct } from "../lib/types";
import { displayDomain, normalizeProduct, parsePriceValue } from "../lib/utils";

type SaveState = "idle" | "saved" | "already" | "error";

const blankProduct: ExtractedProduct = {
  brand: "",
  name: "",
  priceText: "",
  shippingText: "",
  imageUrl: "",
  productUrl: "",
  domain: ""
};

export function Popup() {
  const [product, setProduct] = useState<ExtractedProduct>(blankProduct);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProduct() {
      try {
        const extracted = await extractProductFromActiveTab();
        if (!mounted) return;
        if (extracted) {
          setProduct(extracted);
          setMessage("");
        } else {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          const url = tab?.url || "";
          setProduct({
            ...blankProduct,
            productUrl: url,
            domain: url ? displayDomain(url) : ""
          });
          setMessage("Product details were not detected. You can add them manually.");
        }
      } catch {
        if (!mounted) return;
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tab?.url || "";
        setProduct({
          ...blankProduct,
          productUrl: url,
          domain: url ? displayDomain(url) : ""
        });
        setMessage("Product details were not detected. You can add them manually.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProduct();
    return () => {
      mounted = false;
    };
  }, []);

  const previewImage = useMemo(() => product.imageUrl?.trim(), [product.imageUrl]);

  function updateField(field: keyof ExtractedProduct, value: string) {
    setProduct((current) => ({
      ...current,
      [field]: value,
      ...(field === "priceText" ? { priceValue: parsePriceValue(value) } : {})
    }));
    setSaveState("idle");
  }

  async function handleSave() {
    if (!product.productUrl) {
      setSaveState("error");
      setMessage("Open a product page before saving.");
      return;
    }

    const normalized = normalizeProduct(product);
    const result = await saveProduct(normalized, true);
    setSaveState(result.alreadySaved ? "already" : "saved");
    setMessage(result.alreadySaved ? "Already saved. Product info was updated." : "Saved to your closet.");
  }

  function openCloset() {
    chrome.tabs.create({ url: chrome.runtime.getURL("closet.html") });
  }

  return (
    <main className="w-[380px] bg-slate-50 p-4 text-ink">
      <section className="rounded-[18px] border border-line bg-white p-4 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-white">
              <Shirt size={18} />
            </div>
            <div>
              <h1 className="text-base font-semibold">SaveToBuy</h1>
              <p className="text-xs text-muted">Unified closet saver</p>
            </div>
          </div>
          <button
            className="inline-flex h-9 items-center gap-1 rounded-full border border-line px-3 text-xs font-medium text-ink transition hover:bg-slate-50"
            onClick={openCloset}
          >
            <ExternalLink size={14} />
            Open Closet
          </button>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center gap-2 text-sm text-muted">
            <Loader2 className="animate-spin" size={18} />
            Reading page
          </div>
        ) : (
          <>
            <div className="mb-4 overflow-hidden rounded-2xl border border-line bg-slate-50">
              {previewImage ? (
                <img className="h-44 w-full object-cover" src={previewImage} alt="" />
              ) : (
                <div className="grid h-44 place-items-center text-sm text-muted">No image detected</div>
              )}
              <div className="space-y-1 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                  {product.brand || "Brand unknown"}
                </p>
                <p className="line-clamp-2 text-sm font-semibold">{product.name || "Product name unknown"}</p>
                <p className="text-sm text-muted">{product.priceText || "Price unknown"}</p>
              </div>
            </div>

            <div className="grid gap-3">
              <Field label="Brand" value={product.brand} onChange={(value) => updateField("brand", value)} />
              <Field label="Product name" value={product.name} onChange={(value) => updateField("name", value)} />
              <Field label="Price" value={product.priceText} onChange={(value) => updateField("priceText", value)} />
              <Field label="Shipping" value={product.shippingText || ""} onChange={(value) => updateField("shippingText", value)} />
            </div>

            {message ? (
              <p
                className={`mt-3 rounded-xl px-3 py-2 text-xs ${
                  saveState === "saved" || saveState === "already"
                    ? "bg-green-50 text-green-700"
                    : saveState === "error"
                      ? "bg-red-50 text-red-700"
                      : "bg-slate-100 text-muted"
                }`}
              >
                {message}
              </p>
            ) : null}

            <button
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-white transition hover:bg-[#098d0d]"
              onClick={handleSave}
            >
              <Save size={16} />
              Save to Closet
            </button>
          </>
        )}
      </section>
    </main>
  );
}

function Field({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-xs font-medium text-muted">
      {label}
      <input
        className="h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
