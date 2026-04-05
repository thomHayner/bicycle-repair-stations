import { useState } from "react";
import { useNavigate } from "react-router-dom";

const PRESET_AMOUNTS = [1, 2, 5] as const;
type PresetAmount = (typeof PRESET_AMOUNTS)[number];

export default function DonatePage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<PresetAmount | null>(2);
  const [customInput, setCustomInput] = useState("10");

  const effectiveAmount: number | null = (() => {
    if (selected !== null) return selected;
    const parsed = parseInt(customInput, 10);
    if (!customInput.trim() || isNaN(parsed) || parsed < 1 || parsed > 100) return null;
    return parsed;
  })();

  return (
    <div className="fixed inset-0 z-[2000] bg-[var(--color-surface-container)] flex flex-col">
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
        <span className="font-semibold text-slate-900 dark:text-white">Donate</span>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-8 flex flex-col gap-8">
        {/* Hero */}
        <div className="flex flex-col items-center gap-3 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            className="text-[var(--color-primary)]">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <p className="font-bold text-slate-900 dark:text-white text-xl">Support BicycleRepairStations</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
            Did the site help you find a station or get back on the road? Want to help keep it free for other cyclists? Any amount helps cover hosting and development costs.
          </p>
        </div>

        {/* Preset amounts */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Choose an amount</p>
          <div className="flex gap-3">
            {PRESET_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => { setSelected(amount); setCustomInput(""); }}
                className={[
                  "flex-1 py-3 rounded-full text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-green-600 focus-visible:outline-offset-2 dark:focus-visible:outline-green-400",
                  selected === amount
                    ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                    : "border border-[var(--color-border)] bg-[var(--color-surface)] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-700/60",
                ].join(" ")}
              >
                ${amount}
              </button>
            ))}
          </div>
        </div>

        {/* Custom amount */}
        <div className="flex flex-col gap-3">
          <label htmlFor="custom-amount" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Or enter a custom amount
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm pointer-events-none select-none">$</span>
            <input
              id="custom-amount"
              type="number"
              inputMode="numeric"
              min="1"
              max="100"
              step="1"
              placeholder="10"
              value={customInput}
              onChange={(e) => { setCustomInput(e.target.value); setSelected(null); }}
              className="w-full pl-7 pr-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:focus:ring-green-400/40 transition-colors"
            />
          </div>
        </div>

        {/* Donate button */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={effectiveAmount === null}
            onClick={() => {
              // TODO: integrate payment processor (Buy Me a Coffee / Ko-fi / Patreon / etc.)
              // Navigate to external donation URL with amount: effectiveAmount
            }}
            className={[
              "w-full py-3.5 rounded-full text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-green-600 focus-visible:outline-offset-2 dark:focus-visible:outline-green-400",
              effectiveAmount !== null
                ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:brightness-95 active:brightness-90"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed",
            ].join(" ")}
          >
            {effectiveAmount !== null ? `Donate $${effectiveAmount}` : "Donate"}
          </button>
          <p className="text-center text-xs text-slate-400 dark:text-slate-500">
            Payment integration coming soon — button is currently disabled.
          </p>
        </div>

        {/* Info card */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Where your donation goes</p>
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] elevation-1 px-4 py-4 flex flex-col gap-2.5">
            {[
              "Server and hosting costs",
              "Map tile and API usage",
              "Keeping the app free and maintained",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
