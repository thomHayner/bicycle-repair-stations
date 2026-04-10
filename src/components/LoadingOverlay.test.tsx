import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LoadingOverlay } from "./LoadingOverlay";
import type { LocaleCode } from "../i18n/locales";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("LoadingOverlay", () => {
  it("returns null when visible=false", () => {
    const { container } = render(
      <LoadingOverlay visible={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders spinner mode with role=status and aria-live=polite", () => {
    render(<LoadingOverlay visible={true} />);
    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("renders the app name in spinner mode", () => {
    render(<LoadingOverlay visible={true} />);
    // t() mock returns the key without namespace: "appName"
    expect(screen.getByText("appName")).toBeInTheDocument();
  });

  it("renders dialog mode when suggestedLocale + onLocaleChosen are provided", () => {
    const onLocaleChosen = vi.fn();
    render(
      <LoadingOverlay
        visible={true}
        suggestedLocale={"fr" as LocaleCode}
        onLocaleChosen={onLocaleChosen}
      />
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("dialog mode renders English and native language buttons", () => {
    const onLocaleChosen = vi.fn();
    render(
      <LoadingOverlay
        visible={true}
        suggestedLocale={"fr" as LocaleCode}
        onLocaleChosen={onLocaleChosen}
      />
    );
    expect(screen.getByText("English")).toBeInTheDocument();
    // French native name
    expect(screen.getByText("Français")).toBeInTheDocument();
  });

  it("clicking native language button calls onLocaleChosen with the locale code", () => {
    const onLocaleChosen = vi.fn();
    render(
      <LoadingOverlay
        visible={true}
        suggestedLocale={"fr" as LocaleCode}
        onLocaleChosen={onLocaleChosen}
      />
    );
    fireEvent.click(screen.getByText("Français"));
    expect(onLocaleChosen).toHaveBeenCalledWith("fr");
  });

  it("clicking English button calls onLocaleChosen with 'en'", () => {
    const onLocaleChosen = vi.fn();
    render(
      <LoadingOverlay
        visible={true}
        suggestedLocale={"fr" as LocaleCode}
        onLocaleChosen={onLocaleChosen}
      />
    );
    fireEvent.click(screen.getByText("English"));
    expect(onLocaleChosen).toHaveBeenCalledWith("en");
  });

  it("Escape key calls onLocaleChosen('en') in dialog mode", () => {
    const onLocaleChosen = vi.fn();
    render(
      <LoadingOverlay
        visible={true}
        suggestedLocale={"de" as LocaleCode}
        onLocaleChosen={onLocaleChosen}
      />
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onLocaleChosen).toHaveBeenCalledWith("en");
  });
});
