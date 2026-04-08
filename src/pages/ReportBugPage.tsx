import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface ReportBugResponse {
  issueUrl: string;
  issueNumber: number;
}

const EMPTY_FORM = {
  summary: "",
  description: "",
  steps: "",
  expected: "",
  theme: "Not sure" as string,
  device: "",
  screenshots: "",
};

const THEME_OPTIONS = [
  { value: "Light", tKey: "themeLight" },
  { value: "Dark", tKey: "themeDark" },
  { value: "System default", tKey: "themeSystem" },
  { value: "Not sure", tKey: "themeNotSure" },
] as const;

export default function ReportBugPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("reportBug");
  const { t: tCommon } = useTranslation("common");
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdIssue, setCreatedIssue] = useState<ReportBugResponse | null>(null);

  const missingRequired = useMemo(() => {
    return [form.summary, form.description, form.steps, form.expected].some((value) => !value.trim());
  }, [form.summary, form.description, form.steps, form.expected]);

  const canSubmit = !missingRequired && !isSubmitting;

  const setField = (key: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);
    setCreatedIssue(null);

    try {
      const response = await fetch("/api/report-bug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json")
        ? await response.json().catch(() => ({}))
        : { error: await response.text().catch(() => "") };

      if (!response.ok) {
        const serverError = typeof payload.error === "string" ? payload.error.trim() : "";
        const statusMessage = (() => {
          if (response.status === 404) return t("errorApi404");
          if (response.status === 403) return t("errorApi403");
          if (response.status === 500) return t("errorApi500");
          if (response.status === 502) return t("errorApi502");
          return t("errorApiGeneric", { status: response.status });
        })();

        const message = serverError || statusMessage;
        throw new Error(message);
      }

      setCreatedIssue({
        issueUrl: payload.issueUrl,
        issueNumber: payload.issueNumber,
      });
      setForm(EMPTY_FORM);
    } catch (submitError) {
      if (submitError instanceof TypeError) {
        setError(t("errorNetwork"));
        return;
      }
      setError(submitError instanceof Error ? submitError.message : t("errorGeneric"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForAnotherReport = () => {
    setCreatedIssue(null);
    setError(null);
    setForm(EMPTY_FORM);
  };

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

      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t("heading")}</h1>
          <p className="type-body-medium text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("description")}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/20 dark:border-amber-800/70 dark:text-amber-300">
          {t("safetyWarning")}
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/20 dark:border-red-800/70 dark:text-red-300">
            {error}
          </div>
        )}

        {createdIssue ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-5 text-sm text-green-900 dark:bg-green-950/20 dark:border-green-800/70 dark:text-green-300 flex flex-col gap-4 elevation-1">
            <p className="text-base font-semibold text-green-900 dark:text-green-200">{t("successTitle")}</p>
            <p>
              {t("successMessage", { number: createdIssue.issueNumber })}
            </p>
            <div className="flex flex-col gap-2">
              <a
                href={createdIssue.issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex justify-center items-center rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] px-4 py-2.5 font-semibold hover:brightness-95 active:brightness-90 focus-ring"
              >
                {t("viewOnGithub")}
              </a>
              <button
                type="button"
                onClick={resetForAnotherReport}
                className="inline-flex justify-center items-center rounded-full border border-green-400/60 dark:border-green-700 px-4 py-2.5 font-semibold state-surface focus-ring"
              >
                {t("reportAnother")}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FieldLabel htmlFor="bug-summary" label={t("bugSummary")} required />
            <input
              id="bug-summary"
              value={form.summary}
              onChange={(event) => setField("summary", event.target.value)}
              placeholder={t("summaryPlaceholder")}
              maxLength={120}
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:focus:ring-green-400/40 transition-colors"
            />

            <FieldLabel htmlFor="bug-description" label={t("whatHappened")} required />
            <textarea
              id="bug-description"
              value={form.description}
              onChange={(event) => setField("description", event.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:focus:ring-green-400/40 transition-colors"
            />

            <FieldLabel htmlFor="bug-steps" label={t("stepsToReproduce")} required />
            <textarea
              id="bug-steps"
              value={form.steps}
              onChange={(event) => setField("steps", event.target.value)}
              rows={4}
              placeholder={t("stepsPlaceholder")}
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:focus:ring-green-400/40 transition-colors"
            />

            <FieldLabel htmlFor="bug-expected" label={t("expectedBehaviour")} required />
            <textarea
              id="bug-expected"
              value={form.expected}
              onChange={(event) => setField("expected", event.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:focus:ring-green-400/40 transition-colors"
            />

            <FieldLabel htmlFor="bug-theme" label={t("colourTheme")} />
            <select
              id="bug-theme"
              value={form.theme}
              onChange={(event) => setField("theme", event.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:focus:ring-green-400/40 transition-colors"
            >
              {THEME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{t(opt.tKey)}</option>
              ))}
            </select>

            <FieldLabel htmlFor="bug-device" label={t("deviceBrowser")} />
            <input
              id="bug-device"
              value={form.device}
              onChange={(event) => setField("device", event.target.value)}
              placeholder={t("devicePlaceholder")}
              maxLength={140}
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:focus:ring-green-400/40 transition-colors"
            />

            <FieldLabel htmlFor="bug-screenshots" label={t("screenshots")} />
            <textarea
              id="bug-screenshots"
              value={form.screenshots}
              onChange={(event) => setField("screenshots", event.target.value)}
              rows={3}
              placeholder={t("screenshotsPlaceholder")}
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:focus:ring-green-400/40 transition-colors"
            />

            <button
              type="submit"
              disabled={!canSubmit}
              className={[
                "w-full py-3.5 mt-1 rounded-full text-sm font-bold transition-colors focus-ring",
                canSubmit
                  ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:brightness-95 active:brightness-90"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed",
              ].join(" ")}
            >
              {isSubmitting ? t("submitting") : t("submitButton")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function FieldLabel({
  htmlFor,
  label,
  required = false,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="type-label-overline text-slate-500 dark:text-slate-400">
      {label}
      {required ? " *" : ""}
    </label>
  );
}
