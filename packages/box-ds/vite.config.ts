import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: path.resolve(__dirname, "docs-src"),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@box-ds": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 6006,
    open: true,
  },
  build: {
    outDir: path.resolve(__dirname, "docs-dist"),
    emptyOutDir: true,
  },
});
