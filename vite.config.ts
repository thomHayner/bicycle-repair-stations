/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig(({ mode }) => {
  // loadEnv picks up non-VITE_-prefixed vars from .env* files — without this,
  // SENTRY_AUTH_TOKEN / SENTRY_ORG / SENTRY_PROJECT are only visible when
  // exported to the shell (e.g. in CI), not when set in a local .env.
  const env = loadEnv(mode, process.cwd(), "");
  const sentryAuthToken = env.SENTRY_AUTH_TOKEN;
  const sentryOrg = env.SENTRY_ORG;
  const sentryProject = env.SENTRY_PROJECT;
  const sentryEnabled = Boolean(sentryAuthToken && sentryOrg && sentryProject);

  return {
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
      css: false,
      exclude: ["**/node_modules/**", "**/e2e/**"],
    },
    plugins: [
      react(),
      tailwindcss(),
      ...(sentryEnabled
        ? [
            sentryVitePlugin({
              authToken: sentryAuthToken,
              org: sentryOrg,
              project: sentryProject,
              telemetry: false,
              // Delete .map files from dist/ after upload to Sentry so
              // they aren't publicly fetchable on the deployed site.
              // Sentry retains them on its side for stack-trace mapping.
              sourcemaps: {
                filesToDeleteAfterUpload: ["**/*.map"],
              },
            }),
          ]
        : []),
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
            {
              // i18n translation files (non-English locales loaded at runtime)
              urlPattern: /\/locales\/.*\.json$/,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "i18n-translations",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
          ],
        },
      }),
    ],
    build: {
      target: "es2020",
      sourcemap: sentryEnabled ? "hidden" : false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("leaflet") || id.includes("react-leaflet")) {
              return "leaflet";
            }
            if (id.includes("i18next") || id.includes("react-i18next")) {
              return "i18n";
            }
          },
        },
      },
    },
  };
});
