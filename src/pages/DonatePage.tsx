import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

async function redirectToCheckout(amountDollars: number) {
  const response = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountDollars * 100 }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Checkout failed");
  if (data.url) window.location.href = data.url;
}

const PRESET_AMOUNTS = [1, 2, 5] as const;
type PresetAmount = (typeof PRESET_AMOUNTS)[number];

const INFO_KEYS = ["serverCosts", "apiUsage", "keepingFree"] as const;

export default function DonatePage() {
  const navigate = useNavigate();
  const { t } = useTranslation("donate");
  const { t: tCommon } = useTranslation("common");
  const [selected, setSelected] = useState<PresetAmount | null>(2);
  const [customInput, setCustomInput] = useState("10");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          aria-label={tCommon("back")}
          title={tCommon("goBack")}
          className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 state-surface-strong transition-colors focus-ring"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rtl:scale-x-[-1]">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="type-title-medium text-slate-900 dark:text-white">{t("pageTitle")}</span>
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
          <p className="font-bold text-slate-900 dark:text-white text-xl">{t("heroTitle")}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
            {t("heroText")}
          </p>
        </div>

        {/* Preset amounts */}
        <div className="flex flex-col gap-3">
          <p className="type-label-overline text-slate-500 dark:text-slate-400">{t("chooseAmount")}</p>
          <div className="flex gap-3">
            {PRESET_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => { setSelected(amount); setCustomInput(""); }}
                className={[
                  "flex-1 py-3 rounded-full text-sm font-semibold transition-colors focus-ring",
                  selected === amount
                    ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                    : "border border-[var(--color-border)] bg-[var(--color-surface)] text-slate-600 dark:text-slate-300 state-surface",
                ].join(" ")}
              >
                {t("presetAmount", { amount })}
              </button>
            ))}
          </div>
        </div>

        {/* Custom amount */}
        <div className="flex flex-col gap-3">
          <label htmlFor="custom-amount" className="type-label-overline text-slate-500 dark:text-slate-400">
            {t("customAmount")}
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
            disabled={effectiveAmount === null || loading}
            onClick={async () => {
              if (effectiveAmount === null) return;
              setLoading(true);
              setError(null);
              try {
                await redirectToCheckout(effectiveAmount);
              } catch (err) {
                setError(err instanceof Error ? err.message : t("somethingWentWrong"));
                setLoading(false);
              }
            }}
            className={[
              "w-full py-3.5 rounded-full text-sm font-bold transition-colors focus-ring",
              effectiveAmount !== null
                ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:brightness-95 active:brightness-90"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed",
            ].join(" ")}
          >
            {loading ? t("redirecting") : effectiveAmount !== null ? t("donateAmount", { amount: effectiveAmount }) : t("donateButton")}
          </button>
          {error && (
            <p className="type-body-small text-center text-red-500 dark:text-red-400">{error}</p>
          )}
          <p className="type-body-small text-center text-slate-400 dark:text-slate-500">
            {t("stripeNotice")}
          </p>
        </div>

        {/* Info card */}
        <div className="flex flex-col gap-3">
          <p className="type-label-overline text-slate-500 dark:text-slate-400">{t("whereItGoes")}</p>
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] elevation-1 px-4 py-4 flex flex-col gap-2.5">
            {INFO_KEYS.map((key) => (
              <div key={key} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shrink-0" />
                {t(key)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
