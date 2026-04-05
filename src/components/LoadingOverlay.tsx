interface Props {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message = "Finding your location\u2026" }: Props) {
  if (!visible) return null;
  return (
    <div
      className={[
        "fixed inset-0 z-[2000] flex flex-col items-center justify-center bg-white dark:bg-[#080c14]",
        "transition-opacity duration-300",
        "opacity-100 pointer-events-auto",
      ].join(" ")}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Bicycle + wrench logo */}
      <div className="mb-6 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">BicycleRepairStations.com</h1>
      </div>

      {/* Spinner */}
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
        <span className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin inline-block" />
        {message}
      </div>
    </div>
  );
}
