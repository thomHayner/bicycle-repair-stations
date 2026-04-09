import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

// Silence React's error boundary console output in tests
const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("test render error");
  return <p>All good</p>;
}

afterEach(() => {
  vi.restoreAllMocks();
  consoleError.mockClear();
});

describe("ErrorBoundary", () => {
  it("renders children normally when no error is thrown", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText("All good")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).toBeNull();
  });

  it("renders the fallback UI when a child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("fallback UI contains a Refresh button", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument();
  });

  it("Refresh button calls window.location.reload", () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      value: { ...window.location, reload: reloadMock },
      configurable: true,
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    fireEvent.click(screen.getByRole("button", { name: /refresh/i }));
    expect(reloadMock).toHaveBeenCalledOnce();
  });
});
