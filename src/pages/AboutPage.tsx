import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white dark:bg-[#0d1220] border border-slate-100 dark:border-[#1e2a3a] rounded-2xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium text-slate-700 dark:text-slate-200 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
      >
        <span>{title}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform duration-200 text-slate-500 dark:text-slate-400 shrink-0 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed space-y-3 border-t border-slate-100 dark:border-[#1e2a3a]">
          {children}
        </div>
      )}
    </div>
  );
}

export default function AboutPage() {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-[2000] bg-slate-50 dark:bg-[#080c14] flex flex-col">
      <header className="flex items-center gap-3 px-4 py-4 bg-white dark:bg-[#0d1220] border-b border-slate-100 dark:border-[#1e2a3a] shadow-sm">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="font-semibold text-slate-900 dark:text-white">About</span>
      </header>
      <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          <p className="font-bold text-slate-900 dark:text-white text-xl">BicycleRepairStations.com</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Find public bicycle repair stations near you.</p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data &amp; Credits</p>
          <div className="bg-white dark:bg-[#0d1220] rounded-2xl border border-slate-100 dark:border-[#1e2a3a] divide-y divide-slate-100 dark:divide-[#1e2a3a] shadow-sm">
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 text-sm text-slate-700 dark:text-slate-200 active:bg-slate-50 dark:active:bg-slate-800/50">
              <span>© OpenStreetMap contributors</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-slate-400"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
            <a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 text-sm text-slate-700 dark:text-slate-200 active:bg-slate-50 dark:active:bg-slate-800/50">
              <span>Leaflet — interactive maps</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-slate-400"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
            <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 text-sm text-slate-700 dark:text-slate-200 active:bg-slate-50 dark:active:bg-slate-800/50">
              <span>CARTO — map tiles</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-slate-400"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
            <a href="https://overpass-api.de" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 text-sm text-slate-700 dark:text-slate-200 active:bg-slate-50 dark:active:bg-slate-800/50">
              <span>Overpass API — station data</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-slate-400"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contribute</p>
          <div className="bg-white dark:bg-[#0d1220] rounded-2xl border border-slate-100 dark:border-[#1e2a3a] divide-y divide-slate-100 dark:divide-[#1e2a3a] shadow-sm">
            <a href="https://www.openstreetmap.org/edit" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 text-sm text-slate-700 dark:text-slate-200 active:bg-slate-50 dark:active:bg-slate-800/50">
              <span>Add a missing station on OSM</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-slate-400"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Legal</p>
          <Accordion title="Privacy Policy">
            <p className="pt-3"><strong className="text-slate-600 dark:text-slate-300">Last updated: March 2026</strong></p>
            <p><strong className="text-slate-600 dark:text-slate-300">Data we collect</strong><br/>
            BicycleRepairStations.com does not collect, store, or transmit any personal information. No accounts are required and no analytics or tracking cookies are used.</p>
            <p><strong className="text-slate-600 dark:text-slate-300">Location</strong><br/>
            If you grant location permission, your coordinates are used only to centre the map and find nearby stations. Your location is never sent to our servers — it is processed entirely in your browser and discarded when you close the app.</p>
            <p><strong className="text-slate-600 dark:text-slate-300">Local storage</strong><br/>
            Your preference settings (distance unit, colour theme) are stored in your browser's local storage so they persist between visits. This data never leaves your device.</p>
            <p><strong className="text-slate-600 dark:text-slate-300">Third-party services</strong><br/>
            Tile images are loaded from CARTO, ESRI, Stadia Maps, and OpenStreetMap servers. These providers may log your IP address as part of normal web server operation. Station data is fetched from the Overpass API. Location searches use the Nominatim geocoding service. Please refer to each provider's own privacy policy for details.</p>
            <p><strong className="text-slate-600 dark:text-slate-300">Children</strong><br/>
            This service is not directed at children under 13. We do not knowingly collect data from children.</p>
            <p><strong className="text-slate-600 dark:text-slate-300">Contact</strong><br/>
            Questions about this policy can be sent to the address listed on BicycleRepairStations.com.</p>
          </Accordion>

          <Accordion title="Terms of Service">
            <p className="pt-3"><strong className="text-slate-600 dark:text-slate-300">Last updated: March 2026</strong></p>
            <p><strong className="text-slate-600 dark:text-slate-300">Acceptance</strong><br/>
            By using BicycleRepairStations.com you agree to these terms. If you do not agree, please stop using the service.</p>
            <p><strong className="text-slate-600 dark:text-slate-300">Service description</strong><br/>
            This app helps you locate public bicycle repair stations mapped in OpenStreetMap. It is provided free of charge as a convenience tool for cyclists.</p>
            <p><strong className="text-slate-600 dark:text-slate-300">Data accuracy</strong><br/>
            Station data is sourced from OpenStreetMap, a community-edited dataset. Information may be incomplete, inaccurate, or out of date. Always verify that a station exists and is operational before relying on it for a repair. We accept no liability for missing, incorrectly tagged, or decommissioned stations.</p>
            <p><strong className="text-slate-600 dark:text-slate-300">No warranty</strong><br/>
            The service is provided "as is" without warranty of any kind, express or implied. We do not guarantee uptime, accuracy, or fitness for any particular purpose.</p>
            <p><strong className="text-slate-600 dark:text-slate-300">Limitation of liability</strong><br/>
            To the fullest extent permitted by law, BicycleRepairStations.com and its operators are not liable for any direct, indirect, incidental, or consequential damages arising from your use of or inability to use the service.</p>
            <p><strong className="text-slate-600 dark:text-slate-300">Third-party content</strong><br/>
            Map tiles, station data, and geocoding results are provided by third parties. Their respective terms of service apply.</p>
            <p><strong className="text-slate-600 dark:text-slate-300">Changes</strong><br/>
            We may update these terms at any time. Continued use of the service after changes are posted constitutes acceptance of the revised terms.</p>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
