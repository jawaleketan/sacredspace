import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
      "use-sync-external-store/shim/index.js": "react",
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    pool: "vmThreads",
    // vmThreads can't natively load ESM-inside-CJS packages (htmlparser2, via
    // sanitize-html, fails on Linux CI with "Cannot use import statement
    // outside a module"); inline them so vite transforms them instead.
    server: {
      deps: {
        inline: ["sanitize-html", "htmlparser2"],
      },
    },
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
