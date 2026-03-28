import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix Leaflet's broken default icon URLs when bundled with Vite
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Pulsing blue dot for the user's own position
export const userIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 20px; height: 20px; border-radius: 50%;
      background: #2563eb; border: 3px solid white;
      box-shadow: 0 0 0 2px #2563eb;
      position: relative;
    ">
      <div style="
        width: 40px; height: 40px; border-radius: 50%;
        background: rgba(37,99,235,0.2);
        position: absolute; top: -13px; left: -13px;
        animation: pulse 2s ease-out infinite;
      "></div>
    </div>
    <style>
      @keyframes pulse {
        0% { transform: scale(0.5); opacity: 1; }
        100% { transform: scale(2); opacity: 0; }
      }
    </style>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Teardrop pin for an explicitly searched location (typed search or "Search this area")
export const searchLocationIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 28px; height: 36px;
      position: relative;
      display: flex; align-items: flex-start; justify-content: center;
    ">
      <!-- Teardrop pin body -->
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36" style="position:absolute;top:0;left:0;">
        <path d="M14 0 C6.268 0 0 6.268 0 14 C0 24.5 14 36 14 36 C14 36 28 24.5 28 14 C28 6.268 21.732 0 14 0 Z"
          fill="#0f172a" stroke="white" stroke-width="2"/>
        <!-- Magnifying glass inside -->
        <circle cx="13" cy="13" r="4.5" stroke="white" stroke-width="1.8" fill="none"/>
        <line x1="16.5" y1="16.5" x2="19.5" y2="19.5" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    </div>
  `,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -38],
});

// Wrench icon for repair stations
export const stationIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 36px; height: 36px; border-radius: 50%;
      background: #16a34a; border: 3px solid #bae6fd;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});
