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
    setupFiles: ["./src/test-setup.ts"],
    // Split projects: the DOM tests are the expensive ones (each jsdom
    // environment creation dominated suite time), so they run on vmThreads
    // to share one environment per worker. The node-env server/lib tests
    // stay on the default threads pool — admin.test.ts pulls in
    // sanitize-html → htmlparser2, which ships ESM inside a CJS package
    // and hard-crashes native vm loading on Linux CI ("Cannot use import
    // statement outside a module"); that subgraph never enters vmThreads.
    projects: [
      {
        extends: true,
        test: {
          name: "dom",
          include: ["src/components/**/*.test.{ts,tsx}"],
          pool: "vmThreads",
        },
      },
      {
        extends: true,
        test: {
          name: "node",
          include: ["src/{lib,server}/**/*.test.{ts,tsx}"],
          environment: "node",
        },
      },
    ],
  },
});
