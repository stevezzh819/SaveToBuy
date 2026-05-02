# SaveToBuy

SaveToBuy is a Manifest V3 Chrome extension for saving clothing products from shopping sites into a unified local closet.

## Local Setup

```bash
npm install
npm run build
```

The production extension is built into `dist/`.

## Install Locally In Chrome

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select the `dist/` folder.
5. Pin SaveToBuy from the Chrome toolbar.

## Test On Product Pages

1. Open a clothing product page, for example `https://edikted.com/collections/tops/products/s20409_white`.
2. Click the SaveToBuy extension icon.
3. Review the extracted preview. If a site blocks or omits metadata, fill in the manual fields.
4. Click Save to Closet.
5. Click Open Closet to view the saved grid, filter by status, search by brand/name, sort by saved date or price, update status, delete items, or open the original page.

## Build A Chrome Web Store Zip

```bash
npm run build
cd dist
zip -r ../savetobuy-extension.zip .
```

Upload `savetobuy-extension.zip` in the Chrome Web Store developer dashboard.

## Known Limitations

- Product extraction depends on metadata and visible page markup. Some sites hide price, shipping, or images behind client state, region gates, or anti-bot defenses.
- Shipping fee is often unavailable until checkout or address selection, so the closet shows `Shipping unknown` when it cannot be detected.
- Data is stored only in `chrome.storage.local`; there is no account sync or backend in this MVP.
- Duplicate saves are detected by exact product URL.
# SaveToBuy
