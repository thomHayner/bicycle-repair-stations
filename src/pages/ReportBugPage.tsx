import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type ThemeChoice = "Light" | "Dark" | "System default" | "Not sure";

interface ReportBugResponse {
  issueUrl: string;
  issueNumber: number;
}

const EMPTY_FORM = {
  summary: "",
  description: "",
  steps: "",
  expected: "",
  theme: "Not sure" as ThemeChoice,
  device: "",
  screenshots: "",
};

export default function ReportBugPage() {
  const navigate = useNavigate();
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

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = typeof payload.error === "string"
          ? payload.error
          : "We could not submit your bug report right now.";
        throw new Error(message);
      }

      setCreatedIssue({
        issueUrl: payload.issueUrl,
        issueNumber: payload.issueNumber,
      });
      setForm(EMPTY_FORM);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-50 dark:bg-[#080c14] flex flex-col">
      <header className="flex items-center gap-3 px-4 py-4 bg-white dark:bg-[#0d1220] border-b border-slate-100 dark:border-[#1e2a3a] shadow-sm shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="font-semibold text-slate-900 dark:text-white">Report a bug</span>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Help us fix issues faster</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Your report creates a GitHub issue for maintainers to triage.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/20 dark:border-amber-800/70 dark:text-amber-300">
          Keep this report public-safe. Do not include personal information, email addresses, phone numbers, home/work addresses, or account secrets.
        </div>

        {createdIssue && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 dark:bg-green-950/20 dark:border-green-800/70 dark:text-green-300 flex items-center justify-between gap-3">
            <span>Issue #{createdIssue.issueNumber} created successfully.</span>
            <a
              href={createdIssue.issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-2"
            >
              View issue
            </a>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/20 dark:border-red-800/70 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldLabel htmlFor="bug-summary" label="Bug summary" required />
          <input
            id="bug-summary"
            value={form.summary}
            onChange={(event) => setField("summary", event.target.value)}
            placeholder="Short title for the issue"
            maxLength={120}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#1e2a3a] bg-white dark:bg-[#0d1220] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:focus:ring-green-400/40 transition-colors"
          />

          <FieldLabel htmlFor="bug-description" label="What happened?" required />
          <textarea
            id="bug-description"
            value={form.description}
            onChange={(event) => setField("description", event.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#1e2a3a] bg-white dark:bg-[#0d1220] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:focus:ring-green-400/40 transition-colors"
          />

          <FieldLabel htmlFor="bug-steps" label="Steps to reproduce" required />
          <textarea
            id="bug-steps"
            value={form.steps}
            onChange={(event) => setField("steps", event.target.value)}
            rows={4}
            placeholder={"1. Open the app\n2. Tap ...\n3. See error"}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#1e2a3a] bg-white dark:bg-[#0d1220] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:focus:ring-green-400/40 transition-colors"
          />

          <FieldLabel htmlFor="bug-expected" label="Expected behaviour" required />
          <textarea
            id="bug-expected"
            value={form.expected}
            onChange={(event) => setField("expected", event.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#1e2a3a] bg-white dark:bg-[#0d1220] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:focus:ring-green-400/40 transition-colors"
          />

          <FieldLabel htmlFor="bug-theme" label="Colour theme" />
          <select
            id="bug-theme"
            value={form.theme}
            onChange={(event) => setField("theme", event.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#1e2a3a] bg-white dark:bg-[#0d1220] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:focus:ring-green-400/40 transition-colors"
          >
            <option>Light</option>
            <option>Dark</option>
            <option>System default</option>
            <option>Not sure</option>
          </select>

          <FieldLabel htmlFor="bug-device" label="Device and browser" />
          <input
            id="bug-device"
            value={form.device}
            onChange={(event) => setField("device", event.target.value)}
            placeholder="e.g. iPhone 15 / Safari 17"
            maxLength={140}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#1e2a3a] bg-white dark:bg-[#0d1220] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:focus:ring-green-400/40 transition-colors"
          />

          <FieldLabel htmlFor="bug-screenshots" label="Screenshots or recording links" />
          <textarea
            id="bug-screenshots"
            value={form.screenshots}
            onChange={(event) => setField("screenshots", event.target.value)}
            rows={3}
            placeholder="Paste links to screenshots, videos, or cloud files"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#1e2a3a] bg-white dark:bg-[#0d1220] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:focus:ring-green-400/40 transition-colors"
          />

          <button
            type="submit"
            disabled={!canSubmit}
            className={[
              "w-full py-3.5 mt-1 rounded-full text-sm font-bold transition-colors",
              canSubmit
                ? "bg-green-600 dark:bg-green-500 text-white active:bg-green-700 dark:active:bg-green-600"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed",
            ].join(" ")}
          >
            {isSubmitting ? "Submitting..." : "Submit bug report"}
          </button>
        </form>
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
    <label htmlFor={htmlFor} className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
      {label}
      {required ? " *" : ""}
    </label>
  );
}