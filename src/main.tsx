// Sentry must be initialized before any other side-effect import so that
// errors thrown during i18n, Leaflet, or other module init are captured.
import "./lib/sentryInit";
import "./i18n"; // i18n must be initialized before any component renders
import "./lib/leafletConfig"; // Must be imported before any Leaflet usage
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
