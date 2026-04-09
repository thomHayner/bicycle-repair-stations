import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { StationPopup } from "./StationPopup";
import type { OverpassNode } from "../../types/overpass";

// Provide a settings context value for the popup
vi.mock("../../context/useSettings", () => ({
  useSettings: vi.fn(() => ({ unit: "mi" })),
}));

import { useSettings } from "../../context/useSettings";

const mockUseSettings = useSettings as ReturnType<typeof vi.fn>;

const iPhoneUA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15";
const androidUA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/114.0 Mobile Safari/537.36";

function makeStation(tagOverrides: OverpassNode["tags"] = {}): OverpassNode {
  return { type: "node", id: 1, lat: 51.5, lon: -0.1, tags: tagOverrides };
}

afterEach(() => {
  vi.restoreAllMocks();
  mockUseSettings.mockReturnValue({ unit: "mi" });
});

describe("StationPopup", () => {
  it("renders the station name when present in tags", () => {
    render(<StationPopup station={makeStation({ name: "Central Bike Stop" })} distMi={null} />);
    expect(screen.getByText("Central Bike Stop")).toBeInTheDocument();
  });

  it("falls back to translation key when name is absent", () => {
    render(<StationPopup station={makeStation()} distMi={null} />);
    // t() mock returns the key without namespace prefix: "defaultStationName"
    expect(screen.getByText("defaultStationName")).toBeInTheDocument();
  });

  it("renders tools badge when service:bicycle:tools=yes", () => {
    render(<StationPopup station={makeStation({ "service:bicycle:tools": "yes" })} distMi={null} />);
    expect(screen.getByText("tools")).toBeInTheDocument();
  });

  it("renders pump badge when service:bicycle:pump=yes", () => {
    render(<StationPopup station={makeStation({ "service:bicycle:pump": "yes" })} distMi={null} />);
    expect(screen.getByText("pump")).toBeInTheDocument();
    expect(screen.queryByText("tools")).toBeNull();
  });

  it("renders repair badge when service:bicycle:repair=yes", () => {
    render(<StationPopup station={makeStation({ "service:bicycle:repair": "yes" })} distMi={null} />);
    expect(screen.getByText("repair")).toBeInTheDocument();
  });

  it("renders no amenity badges when no service tags are set", () => {
    render(<StationPopup station={makeStation()} distMi={null} />);
    expect(screen.queryByText("tools")).toBeNull();
    expect(screen.queryByText("pump")).toBeNull();
    expect(screen.queryByText("repair")).toBeNull();
  });

  it("shows distance in miles when unit=mi", () => {
    mockUseSettings.mockReturnValue({ unit: "mi" });
    render(<StationPopup station={makeStation()} distMi={1.5} />);
    // t() mock formats: "distanceAway (distance:1.5, unit:mi)"
    expect(screen.getByText(/distanceAway/)).toBeInTheDocument();
    expect(screen.getByText(/unit:mi/)).toBeInTheDocument();
  });

  it("shows distance in km when unit=km", () => {
    mockUseSettings.mockReturnValue({ unit: "km" });
    render(<StationPopup station={makeStation()} distMi={1.0} />);
    expect(screen.getByText(/unit:km/)).toBeInTheDocument();
  });

  it("does not render distance when distMi is null", () => {
    render(<StationPopup station={makeStation()} distMi={null} />);
    expect(screen.queryByText(/map:distanceAway/)).toBeNull();
  });

  it("get directions link points to Apple Maps on iPhone", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(iPhoneUA);
    const { container } = render(
      <StationPopup station={makeStation()} distMi={null} />
    );
    const link = container.querySelector("a[href]") as HTMLAnchorElement;
    expect(link.href).toContain("maps.apple.com");
    expect(link.href).toContain("dirflg=b");
  });

  it("get directions link points to Google Maps on Android", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(androidUA);
    const { container } = render(
      <StationPopup station={makeStation()} distMi={null} />
    );
    const link = container.querySelector("a[href]") as HTMLAnchorElement;
    expect(link.href).toContain("google.com/maps");
    expect(link.href).toContain("travelmode=bicycling");
  });
});
