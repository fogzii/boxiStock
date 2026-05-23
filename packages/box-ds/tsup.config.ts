import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  external: [
    "react",
    "react-dom",
    "@base-ui/react",
    "@radix-ui/react-tooltip",
    "class-variance-authority",
    "clsx",
    "tailwind-merge",
    "lucide-react",
    "react-date-picker",
  ],
  outDir: "dist",
  clean: true,
});
