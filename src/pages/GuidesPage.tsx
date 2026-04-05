import { useNavigate } from "react-router-dom";

// ---------------------------------------------------------------------------
// Park Tool – Bike Repair & Maintenance Video Series
// Thumbnails served keylessly from YouTube's image CDN:
//   https://img.youtube.com/vi/{ID}/mqdefault.jpg
// All links open the video on youtube.com — no API key required.
// ---------------------------------------------------------------------------

interface Video {
  id: string;
  title: string;
}
interface Category {
  label: string;
  emoji: string;
  videos: Video[];
}

const CATEGORIES: Category[] = [
  {
    label: "Flat Tyre & Tubes",
    emoji: "🛞",
    videos: [
      { id: "58STtUM-Wow", title: "How to Fix a Flat Tire" },
      { id: "T0F_hibWHlU", title: "Patching a Tube" },
      { id: "-0p5pE4sRJM", title: "Tubeless Tyre Setup" },
    ],
  },
  {
    label: "Brakes",
    emoji: "🤚",
    videos: [
      { id: "q4ay12CSF48", title: "Adjusting Rim Brakes" },
      { id: "NmqGeLNcVIg", title: "Disc Brake Adjustment" },
      { id: "Xqw0SaZl-jo", title: "Replacing Brake Pads" },
    ],
  },
  {
    label: "Gears & Shifting",
    emoji: "⚙️",
    videos: [
      { id: "UkZxPIZ1ngY", title: "Rear Derailleur Adjustment" },
      { id: "ZNG7g83lI-s", title: "Front Derailleur Adjustment" },
      { id: "0zD5wT16Rvw", title: "Replacing Gear Cable & Housing" },
    ],
  },
  {
    label: "Chain & Drivetrain",
    emoji: "⛓️",
    videos: [
      { id: "MuwS_nSevy4", title: "Cleaning & Lubing the Chain" },
      { id: "VdUQKVMPF5I", title: "Replacing the Chain" },
      { id: "9KAaP7pbFV0", title: "Cassette Removal & Installation" },
    ],
  },
  {
    label: "Wheels",
    emoji: "☸️",
    videos: [
      { id: "MFOng1UXn-g", title: "Truing a Wheel" },
      { id: "FlQn_JA0sI4", title: "Spoke Replacement" },
      { id: "Uxi7wTRGfZM", title: "Hub Adjustment" },
    ],
  },
  {
    label: "Headset & Stem",
    emoji: "🔩",
    videos: [
      { id: "h2eURoPn7uU", title: "Adjusting a Threadless Headset" },
      { id: "TPYGv6fMnBw", title: "Stem Installation" },
    ],
  },
  {
    label: "Bottom Bracket",
    emoji: "🔧",
    videos: [
      { id: "xUtOeFJJycg", title: "Bottom Bracket Removal & Install" },
      { id: "e-8G1G9QNX8", title: "Identifying Your Bottom Bracket" },
    ],
  },
];

function VideoCard({ video }: { video: Video }) {
  return (
    <a
      href={`https://www.youtube.com/watch?v=${video.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 items-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-sm p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-700/60 transition-colors focus-visible:outline-2 focus-visible:outline-green-600 focus-visible:outline-offset-2 dark:focus-visible:outline-green-400"
    >
      <div className="relative shrink-0 w-28 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-video">
        <img
          src={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`}
          alt={video.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Play badge */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
        </div>
      </div>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug flex-1">
        {video.title}
      </p>
      <svg className="shrink-0 text-slate-500 dark:text-slate-400" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
        <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
    </a>
  );
}

export default function GuidesPage() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-[2000] bg-[var(--color-surface-container)] flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 bg-[var(--color-surface)] border-b border-[var(--color-border)] shadow-sm shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          title="Go back"
          className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-colors focus-visible:outline-2 focus-visible:outline-green-600 focus-visible:outline-offset-2 dark:focus-visible:outline-green-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="font-semibold text-slate-900 dark:text-white flex-1">Repair Guides</span>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Park Tool banner */}
        <div className="mx-4 mt-5 mb-1 bg-[var(--color-secondary)] rounded-2xl px-5 py-4 flex items-center justify-between gap-4 shadow-md">
          <div>
            <p className="font-bold text-[var(--color-on-secondary)] text-base leading-tight">Park Tool</p>
            <p className="text-[var(--color-secondary-container)] text-xs mt-0.5">Bike Repair &amp; Maintenance Series</p>
          </div>
          <a
            href="https://www.youtube.com/@ParkTool"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 text-[#ff0000] text-xs font-bold hover:bg-red-50 active:bg-red-100 transition-colors focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#ff0000" stroke="none" aria-hidden="true">
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.8 15.5V8.5l6.4 3.5-6.4 3.5z"/>
            </svg>
            YouTube
          </a>
        </div>

        {/* Category sections */}
        <div className="px-4 pb-8 flex flex-col gap-6 mt-5">
          {CATEGORIES.map((cat) => (
            <section key={cat.label}>
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </h2>
              <div className="flex flex-col gap-2">
                {cat.videos.map((v) => (
                  <VideoCard key={v.id} video={v} />
                ))}
              </div>
            </section>
          ))}

          {/* Footer note */}
          <p className="text-center text-xs text-slate-500 dark:text-slate-400 pb-2">
            Videos by{" "}
            <a href="https://www.parktool.com" target="_blank" rel="noopener noreferrer" className="underline">
              Park Tool
            </a>
            {" "}· Opens YouTube
          </p>
        </div>
      </div>
    </div>
  );
}
