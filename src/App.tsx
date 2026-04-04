import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { SettingsProvider } from "./context/SettingsContext";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/react"

const MapPage      = lazy(() => import("./pages/MapPage"));
const GuidesPage   = lazy(() => import("./pages/GuidesPage"));
const AboutPage    = lazy(() => import("./pages/AboutPage"));
const DonatePage   = lazy(() => import("./pages/DonatePage"));

export default function App() {
  return (
    <SettingsProvider>
      <Analytics /> {/* Vercel Analytics component for tracking user interactions */}
      <SpeedInsights /> {/* Vercel Speed Insights component for performance monitoring */}
      
      {/* MapPage is always mounted — navigating to overlay pages never unmounts the map */}
      <MapPage />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/guides"   element={<GuidesPage />} />
          <Route path="/about"    element={<AboutPage />} />
          <Route path="/donate"   element={<DonatePage />} />
          <Route path="*"         element={null} />
        </Routes>
      </Suspense>
    </SettingsProvider>
  );
}
