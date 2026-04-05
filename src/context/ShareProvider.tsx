import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { Ctx, type ShareEntryPoint } from "./shareCtx";
import { ShareSheet } from "../components/Share/ShareSheet";
import {
  buildChannelShareUrl,
  copyShareLink,
  getDefaultSharePayload,
  isNativeShareSupported,
  openShareUrl,
} from "../lib/share";
import { trackEvent } from "../lib/analytics";

export function ShareProvider({ children }: { children: ReactNode }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [shareEntryPoint, setShareEntryPoint] = useState<ShareEntryPoint>("toolbar");
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const noticeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (noticeTimeout.current) clearTimeout(noticeTimeout.current);
    };
  }, []);

  const showShareNotice = (message: string) => {
    if (noticeTimeout.current) clearTimeout(noticeTimeout.current);
    setShareNotice(message);
    noticeTimeout.current = setTimeout(() => setShareNotice(null), 2600);
  };

  const openShare = (entryPoint: ShareEntryPoint) => {
    setShareEntryPoint(entryPoint);
    trackEvent("share_opened", { entryPoint, mode: "sheet" });
    setShareOpen(true);
  };

  const closeShare = useCallback(() => setShareOpen(false), []);

  const handleNativeShare = async () => {
    if (!isNativeShareSupported()) return;

    try {
      trackEvent("share_native_initiated", { entryPoint: shareEntryPoint });
      const payload = getDefaultSharePayload();
      await navigator.share({
        title: payload.title,
        text: payload.text,
        url: payload.url,
      });
      trackEvent("share_native_success", { entryPoint: shareEntryPoint });
      setShareOpen(false);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        trackEvent("share_native_cancelled", { entryPoint: shareEntryPoint });
        return;
      }
      trackEvent("share_native_failed", { entryPoint: shareEntryPoint });
    }
  };

  const handleShareToChannel = (channel: "x" | "facebook" | "email") => {
    trackEvent("share_channel_clicked", { channel, entryPoint: shareEntryPoint });
    const shareUrl = buildChannelShareUrl(channel, getDefaultSharePayload());
    openShareUrl(shareUrl);
    setShareOpen(false);
  };

  const handleCopyLink = async () => {
    try {
      await copyShareLink(getDefaultSharePayload());
      trackEvent("share_copy_link", { result: "success", entryPoint: shareEntryPoint });
      setShareOpen(false);
      showShareNotice("Link copied to clipboard.");
    } catch {
      trackEvent("share_copy_link", { result: "failed", entryPoint: shareEntryPoint });
      showShareNotice("Could not copy link on this browser.");
    }
  };

  return (
    <Ctx.Provider value={{ openShare, closeShare }}>
      {children}

      <ShareSheet
        open={shareOpen}
        canUseNativeShare={isNativeShareSupported()}
        onClose={closeShare}
        onNativeShare={handleNativeShare}
        onShareX={() => handleShareToChannel("x")}
        onShareFacebook={() => handleShareToChannel("facebook")}
        onShareEmail={() => handleShareToChannel("email")}
        onCopyLink={handleCopyLink}
      />

      {shareNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 -translate-x-1/2 bottom-20 z-[2800] rounded-full bg-slate-900 text-white text-xs font-semibold px-4 py-2 shadow-lg"
        >
          {shareNotice}
        </div>
      )}
    </Ctx.Provider>
  );
}
