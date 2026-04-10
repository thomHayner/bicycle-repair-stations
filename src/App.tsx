import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Routes, Route } from "react-router-dom";
import { SettingsProvider } from "./context/SettingsContext";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { ShareProvider } from "./context/ShareProvider";

const MapPage      = lazy(() => import("./pages/MapPage"));
const GuidesPage   = lazy(() => import("./pages/GuidesPage"));
const AboutPage    = lazy(() => import("./pages/AboutPage"));
const DonatePage        = lazy(() => import("./pages/DonatePage"));
const DonateSuccessPage = lazy(() => import("./pages/DonateSuccessPage"));
const ReportBugPage     = lazy(() => import("./pages/ReportBugPage"));

export default function App() {
  const { t } = useTranslation("common");
  return (
    <SettingsProvider>
      <ShareProvider>
        <Analytics /> {/* Vercel Analytics component for tracking user interactions */}
        <SpeedInsights /> {/* Vercel Speed Insights component for performance monitoring */}

        <main id="main-content" className="h-full" aria-label={t("appAriaLabel")}>
          {/* MapPage is always mounted — navigating to overlay pages never unmounts the map */}
          <MapPage />
          <Suspense fallback={null}>
            <Routes>
              <Route path="/guides"   element={<GuidesPage />} />
              <Route path="/about"    element={<AboutPage />} />
              <Route path="/donate"   element={<DonatePage />} />
              <Route path="/donate/success" element={<DonateSuccessPage />} />
              <Route path="/report-bug" element={<ReportBugPage />} />
              <Route path="*"         element={null} />
            </Routes>
          </Suspense>
        </main>
      </ShareProvider>
    </SettingsProvider>
  );
}
