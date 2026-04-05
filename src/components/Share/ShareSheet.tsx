import { useEffect, useRef } from "react";

interface Props {
  open: boolean;
  canUseNativeShare: boolean;
  onClose: () => void;
  onNativeShare: () => void;
  onShareX: () => void;
  onShareFacebook: () => void;
  onShareEmail: () => void;
  onCopyLink: () => void;
}

function ShareButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container)] px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 state-surface focus-ring"
    >
      {label}
    </button>
  );
}

export function ShareSheet({
  open,
  canUseNativeShare,
  onClose,
  onNativeShare,
  onShareX,
  onShareFacebook,
  onShareEmail,
  onCopyLink,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousActive = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (!panel) return;

    const getFocusable = () =>
      [...panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )];

    const initial = getFocusable()[0];
    initial?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previousActive && previousActive.isConnected && previousActive.offsetParent !== null) {
        previousActive.focus();
      }
    };
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        className={[
          "fixed inset-0 z-[2600] bg-black/40 transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      <div
        ref={panelRef}
        className={[
          "fixed left-3 right-3 bottom-3 z-[2700] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-container)] p-3 elevation-3",
          "transition-transform duration-200",
          open ? "translate-y-0" : "translate-y-[120%]",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label="Share this app"
        aria-hidden={!open}
        {...(!open ? { inert: true } : {})}
        aria-labelledby="share-sheet-title"
      >
        <div className="mb-3 px-1">
          <p id="share-sheet-title" className="text-sm font-bold text-slate-900 dark:text-slate-100">Share this app</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Personal sharing only: X, Facebook, email, or copy link.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {canUseNativeShare && (
            <ShareButton
              label="More apps (Instagram/Nextdoor if installed)"
              onClick={onNativeShare}
            />
          )}
          <ShareButton label="Share on X" onClick={onShareX} />
          <ShareButton label="Share on Facebook" onClick={onShareFacebook} />
          <ShareButton label="Share by Email" onClick={onShareEmail} />
          <ShareButton label="Copy link" onClick={onCopyLink} />
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 state-surface-strong focus-ring"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
