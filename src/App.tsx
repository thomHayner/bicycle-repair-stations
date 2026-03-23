import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { SettingsProvider } from "./context/SettingsContext";

const MapPage      = lazy(() => import("./pages/MapPage"));
const GuidesPage   = lazy(() => import("./pages/GuidesPage"));
const DiagnosePage = lazy(() => import("./pages/DiagnosePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AboutPage    = lazy(() => import("./pages/AboutPage"));

export default function App() {
  return (
    <SettingsProvider>
      {/* MapPage is always mounted — navigating to overlay pages never unmounts the map */}
      <MapPage />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/guides"   element={<GuidesPage />} />
          <Route path="/diagnose" element={<DiagnosePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/about"    element={<AboutPage />} />
        </Routes>
      </Suspense>
    </SettingsProvider>
  );
}
