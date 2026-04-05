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
      className="w-full rounded-xl border border-slate-200 dark:border-[#1e2a3a] bg-white dark:bg-[#0d1220] px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
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
        className={[
          "fixed left-3 right-3 bottom-3 z-[2700] rounded-2xl border border-slate-100 dark:border-[#1e2a3a] bg-slate-50 dark:bg-[#080c14] p-3 shadow-2xl",
          "transition-transform duration-200",
          open ? "translate-y-0" : "translate-y-[120%]",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label="Share this app"
      >
        <div className="mb-3 px-1">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Share this app</p>
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
            className="w-full rounded-xl px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800/50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
