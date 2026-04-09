import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { useContext } from "react";
import { ShareProvider } from "./ShareProvider";
import { Ctx } from "./shareCtx";

vi.mock("../i18n", () => ({
  default: {
    t: (k: string) => k,
    language: "en",
    changeLanguage: vi.fn(),
  },
}));

vi.mock("../lib/analytics", () => ({
  trackEvent: vi.fn(),
}));

function TestConsumer() {
  const { openShare, closeShare } = useContext(Ctx);
  return (
    <>
      <button onClick={() => openShare("toolbar")}>open</button>
      <button onClick={() => closeShare()}>close</button>
    </>
  );
}

function renderProvider() {
  return render(
    <ShareProvider>
      <TestConsumer />
    </ShareProvider>
  );
}

function getShareDialog() {
  return document.querySelector('[role="dialog"][aria-label]');
}

beforeEach(() => {
  vi.clearAllMocks();
  // Reset clipboard
  Object.defineProperty(navigator, "clipboard", {
    value: undefined,
    configurable: true,
    writable: true,
  });
  const nav = navigator as Record<string, unknown>;
  delete nav.share;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ShareProvider", () => {
  it("ShareSheet is initially closed (aria-hidden=true)", () => {
    renderProvider();
    const dialog = getShareDialog();
    expect(dialog).not.toBeNull();
    expect(dialog!.getAttribute("aria-hidden")).toBe("true");
  });

  it("openShare() opens the ShareSheet (aria-hidden=false)", async () => {
    renderProvider();
    fireEvent.click(screen.getByText("open"));
    await waitFor(() =>
      expect(getShareDialog()!.getAttribute("aria-hidden")).toBe("false")
    );
  });

  it("closeShare() closes the ShareSheet", async () => {
    renderProvider();
    fireEvent.click(screen.getByText("open"));
    await waitFor(() =>
      expect(getShareDialog()!.getAttribute("aria-hidden")).toBe("false")
    );
    fireEvent.click(screen.getByText("close"));
    await waitFor(() =>
      expect(getShareDialog()!.getAttribute("aria-hidden")).toBe("true")
    );
  });

  it("native share button is hidden when navigator.share is not available", () => {
    renderProvider();
    fireEvent.click(screen.getByText("open"));
    // t() returns key without namespace: "nativeShare"
    expect(screen.queryByText("nativeShare")).toBeNull();
  });

  it("native share button is visible when navigator.share is available", async () => {
    Object.defineProperty(navigator, "share", {
      value: vi.fn().mockResolvedValue(undefined),
      configurable: true,
      writable: true,
    });
    renderProvider();
    fireEvent.click(screen.getByText("open"));
    await waitFor(() =>
      expect(getShareDialog()!.getAttribute("aria-hidden")).toBe("false")
    );
    expect(screen.getByText("nativeShare")).toBeInTheDocument();
  });

  it("copy link shows success notice in role=status element", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
      writable: true,
    });

    renderProvider();
    fireEvent.click(screen.getByText("open"));
    await waitFor(() =>
      expect(getShareDialog()!.getAttribute("aria-hidden")).toBe("false")
    );

    // t() returns "copyLink" without namespace
    fireEvent.click(screen.getByText("copyLink"));
    await waitFor(() => {
      const notice = document.querySelector('[role="status"]');
      expect(notice).toBeInTheDocument();
    });
    expect(writeText).toHaveBeenCalledOnce();
  });

  it("copy link failure shows failure notice in role=status element", async () => {
    // clipboard is undefined from beforeEach
    renderProvider();
    fireEvent.click(screen.getByText("open"));
    await waitFor(() =>
      expect(getShareDialog()!.getAttribute("aria-hidden")).toBe("false")
    );

    fireEvent.click(screen.getByText("copyLink"));
    await waitFor(() => {
      const notice = document.querySelector('[role="status"]');
      expect(notice).toBeInTheDocument();
    });
  });

  it("share on X calls window.open with a Twitter URL", async () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue({} as Window);
    renderProvider();
    fireEvent.click(screen.getByText("open"));
    await waitFor(() =>
      expect(getShareDialog()!.getAttribute("aria-hidden")).toBe("false")
    );

    // t() returns "shareOnX" without namespace
    fireEvent.click(screen.getByText("shareOnX"));
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("twitter.com"),
      "_blank",
      expect.any(String)
    );
  });
});
