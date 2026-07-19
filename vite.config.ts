import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: { port: 3000 },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    nitro(),
    viteReact(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "SacredSpace — Mantras & Stotras",
        short_name: "SacredSpace",
        description: "Explore a sacred collection of Sanskrit mantras and stotras.",
        theme_color: "#faf7f2",
        background_color: "#faf7f2",
        display: "standalone",
        icons: [
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,woff2,svg,png,ico}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/sacredspace\.vercel\.app\/api\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    tsconfigPaths: true,
    alias: [
      { find: "use-sync-external-store/shim/index.js", replacement: "react" },
    ],
  },
});
