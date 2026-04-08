import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { StationListView } from "./StationListView";
import type { OverpassNode } from "../types/overpass";

/** Create N fake stations at incrementing distances from (0,0). */
function makeStations(count: number): OverpassNode[] {
  return Array.from({ length: count }, (_, i) => ({
    type: "node" as const,
    id: i + 1,
    lat: i * 0.01,        // each station ~0.69 mi farther from origin
    lon: 0,
    tags: { name: `Station ${i + 1}` },
  }));
}

const defaultProps = {
  filterCenter: { lat: 0, lng: 0 },
  userDistances: null,
  unit: "mi" as const,
  onUnitChange: vi.fn(),
  selectedDist: 250,
  onDistChange: vi.fn(),
  distOptions: [1, 2, 5, 10, 25, 50, 100, 250] as readonly number[],
  onStationSelect: vi.fn(),
  expanded: true,
  onExpandedChange: vi.fn(),
  queryStatus: "success" as const,
};

describe("StationListView pagination", () => {
  it("renders at most 20 stations initially (PAGE_SIZE)", () => {
    const stations = makeStations(50);
    render(<StationListView {...defaultProps} stations={stations} />);

    // Should see 20 station buttons, not 50
    const stationButtons = screen.getAllByRole("button", { name: /Station \d+/ });
    expect(stationButtons).toHaveLength(20);
  });

  it("shows pagination hint when there are more than 20 stations", () => {
    const stations = makeStations(50);
    render(<StationListView {...defaultProps} stations={stations} />);

    // i18n mock renders: showingCount (visible:20, total:50)
    expect(screen.getByText(/showingCount.*visible:20.*total:50/)).toBeInTheDocument();
  });

  it("does NOT show pagination hint when there are 20 or fewer stations", () => {
    const stations = makeStations(15);
    render(<StationListView {...defaultProps} stations={stations} />);

    const stationButtons = screen.getAllByRole("button", { name: /Station \d+/ });
    expect(stationButtons).toHaveLength(15);
    expect(screen.queryByText(/showingCount/)).not.toBeInTheDocument();
  });

  it("renders exactly all stations when count equals PAGE_SIZE", () => {
    const stations = makeStations(20);
    render(<StationListView {...defaultProps} stations={stations} />);

    const stationButtons = screen.getAllByRole("button", { name: /Station \d+/ });
    expect(stationButtons).toHaveLength(20);
    expect(screen.queryByText(/showingCount/)).not.toBeInTheDocument();
  });

  it("loads next batch when scrolled near the bottom", () => {
    const stations = makeStations(50);
    render(<StationListView {...defaultProps} stations={stations} />);

    // Initially 20
    expect(screen.getAllByRole("button", { name: /Station \d+/ })).toHaveLength(20);

    // Find the scrollable panel
    const scrollPanel = screen.getByText(/showingCount.*visible:20.*total:50/).closest(
      "[class*='overflow-y-auto']"
    )!;
    expect(scrollPanel).toBeTruthy();

    // Simulate scroll near bottom
    Object.defineProperty(scrollPanel, "scrollHeight", { value: 2000, configurable: true });
    Object.defineProperty(scrollPanel, "scrollTop", { value: 1950, configurable: true });
    Object.defineProperty(scrollPanel, "clientHeight", { value: 100, configurable: true });

    fireEvent.scroll(scrollPanel);

    // Should now show 40
    expect(screen.getAllByRole("button", { name: /Station \d+/ })).toHaveLength(40);
    expect(screen.getByText(/showingCount.*visible:40.*total:50/)).toBeInTheDocument();
  });

  it("loads remaining stations on second scroll (no over-render)", () => {
    const stations = makeStations(35);
    render(<StationListView {...defaultProps} stations={stations} />);

    expect(screen.getAllByRole("button", { name: /Station \d+/ })).toHaveLength(20);

    const scrollPanel = screen.getByText(/showingCount.*visible:20.*total:35/).closest(
      "[class*='overflow-y-auto']"
    )!;

    // First scroll loads next 20 (but only 15 remain)
    Object.defineProperty(scrollPanel, "scrollHeight", { value: 2000, configurable: true });
    Object.defineProperty(scrollPanel, "scrollTop", { value: 1950, configurable: true });
    Object.defineProperty(scrollPanel, "clientHeight", { value: 100, configurable: true });
    fireEvent.scroll(scrollPanel);

    // All 35 should now be visible, hint gone
    expect(screen.getAllByRole("button", { name: /Station \d+/ })).toHaveLength(35);
    expect(screen.queryByText(/showingCount/)).not.toBeInTheDocument();
  });

  it("resets to PAGE_SIZE when stations prop changes (new search)", () => {
    const stations50 = makeStations(50);
    const { rerender } = render(
      <StationListView {...defaultProps} stations={stations50} />
    );

    // Scroll to load more
    const scrollPanel = screen.getByText(/showingCount.*visible:20.*total:50/).closest(
      "[class*='overflow-y-auto']"
    )!;
    Object.defineProperty(scrollPanel, "scrollHeight", { value: 2000, configurable: true });
    Object.defineProperty(scrollPanel, "scrollTop", { value: 1950, configurable: true });
    Object.defineProperty(scrollPanel, "clientHeight", { value: 100, configurable: true });
    fireEvent.scroll(scrollPanel);
    expect(screen.getAllByRole("button", { name: /Station \d+/ })).toHaveLength(40);

    // New search — different station set
    const stations30 = makeStations(30);
    rerender(<StationListView {...defaultProps} stations={stations30} />);

    // Should reset to 20
    expect(screen.getAllByRole("button", { name: /Station \d+/ })).toHaveLength(20);
    expect(screen.getByText(/showingCount.*visible:20.*total:30/)).toBeInTheDocument();
  });

  it("does not scroll-load when not near the bottom", () => {
    const stations = makeStations(50);
    render(<StationListView {...defaultProps} stations={stations} />);

    const scrollPanel = screen.getByText(/showingCount.*visible:20.*total:50/).closest(
      "[class*='overflow-y-auto']"
    )!;

    // Scroll but far from bottom
    Object.defineProperty(scrollPanel, "scrollHeight", { value: 2000, configurable: true });
    Object.defineProperty(scrollPanel, "scrollTop", { value: 500, configurable: true });
    Object.defineProperty(scrollPanel, "clientHeight", { value: 100, configurable: true });
    fireEvent.scroll(scrollPanel);

    // Still 20
    expect(screen.getAllByRole("button", { name: /Station \d+/ })).toHaveLength(20);
  });

  it("header shows total count, not visible count", () => {
    const stations = makeStations(50);
    render(<StationListView {...defaultProps} stations={stations} />);

    // Header uses stationCount key with count:50
    expect(screen.getByText(/stationCount.*count:50.*distance:250.*unit:mi/)).toBeInTheDocument();
  });
});
