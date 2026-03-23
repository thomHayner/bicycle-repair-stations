import { useNavigate } from "react-router-dom";

export default function DiagnosePage() {
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
        <span className="font-semibold text-slate-900 dark:text-white">Issue Diagnoser</span>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
        <span className="text-5xl">🩺</span>
        <p className="font-semibold text-slate-800 dark:text-slate-100 text-lg">Coming soon</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Describe your problem and we'll walk you through a guided diagnosis — rated by severity and the skill level needed to fix it.</p>
      </div>
    </div>
  );
}
