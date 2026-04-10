import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ErrorToast } from "./ErrorToast";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("ErrorToast", () => {
  it("renders with role=alert and aria-live=assertive", () => {
    render(<ErrorToast message="Network error" onDismiss={vi.fn()} />);
    const toast = screen.getByRole("alert");
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveAttribute("aria-live", "assertive");
  });

  it("displays the passed message", () => {
    render(<ErrorToast message="Something failed" onDismiss={vi.fn()} />);
    expect(screen.getByText("Something failed")).toBeInTheDocument();
  });

  it("auto-dismisses after 5s + 300ms fade-out", () => {
    const onDismiss = vi.fn();
    render(<ErrorToast message="err" onDismiss={onDismiss} />);

    // Advance to just before the hide timer (4999ms) — should not dismiss yet
    act(() => { vi.advanceTimersByTime(4999); });
    expect(onDismiss).not.toHaveBeenCalled();

    // Advance past 5000ms hide timer — starts fade
    act(() => { vi.advanceTimersByTime(1); });
    expect(onDismiss).not.toHaveBeenCalled(); // still fading

    // Advance past 300ms fade-out delay
    act(() => { vi.advanceTimersByTime(300); });
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("dismiss button calls onDismiss after 300ms fade-out", () => {
    const onDismiss = vi.fn();
    render(<ErrorToast message="err" onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole("button"));
    expect(onDismiss).not.toHaveBeenCalled(); // still fading

    act(() => { vi.advanceTimersByTime(300); });
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("dismiss button has an accessible aria-label", () => {
    render(<ErrorToast message="err" onDismiss={vi.fn()} />);
    // t() mock returns the key without namespace: "dismiss"
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-label", "dismiss");
  });
});
