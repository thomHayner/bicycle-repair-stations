/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      // We manage manifest.json manually in /public
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
        runtimeCaching: [
          {
            // CARTO tiles (Voyager, Positron, Dark Matter, labels-only)
            urlPattern: /^https:\/\/[a-d]\.basemaps\.cartocdn\.com\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "carto-tiles",
              expiration: {
                maxEntries: 800,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
          {
            // ESRI World Imagery (satellite layer)
            urlPattern: /^https:\/\/server\.arcgisonline\.com\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "esri-tiles",
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
          {
            // Waymarked Trails overlays (cycling + MTB routes)
            urlPattern: /^https:\/\/tile\.waymarkedtrails\.org\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "waymarked-tiles",
              expiration: {
                maxEntries: 400,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
        ],
      },
    }),
  ],
  build: {
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("leaflet") || id.includes("react-leaflet")) {
            return "leaflet";
          }
        },
      },
    },
  },
});
