import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";

function extensionHtmlOutput() {
  return {
    name: "extension-html-output",
    closeBundle() {
      const moves = [
        ["dist/src/popup/popup.html", "dist/popup.html"],
        ["dist/src/closet/closet.html", "dist/closet.html"]
      ] as const;

      for (const [from, to] of moves) {
        if (!existsSync(from)) continue;
        mkdirSync(dirname(to), { recursive: true });
        cpSync(from, to);
      }

      rmSync("dist/src", { recursive: true, force: true });
    }
  };
}

export default defineConfig({
  plugins: [react(), extensionHtmlOutput()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/popup.html"),
        closet: resolve(__dirname, "src/closet/closet.html"),
        serviceWorker: resolve(__dirname, "src/background/serviceWorker.ts"),
        productExtractor: resolve(__dirname, "src/content/productExtractor.ts")
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  }
});
