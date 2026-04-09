import { describe, it, expect } from "vitest";
import { formatDistance } from "./formatNumber";

describe("formatDistance", () => {
  it("returns '<0.1' for values less than 0.1", () => {
    expect(formatDistance(0.05, "en")).toBe("<0.1");
    expect(formatDistance(0.001, "en")).toBe("<0.1");
  });

  it("returns '<0.1' for zero", () => {
    expect(formatDistance(0, "en")).toBe("<0.1");
  });

  it("returns '<0.1' for negative values", () => {
    expect(formatDistance(-1, "en")).toBe("<0.1");
  });

  it("does NOT return '<0.1' for exactly 0.1 (boundary)", () => {
    expect(formatDistance(0.1, "en")).toBe("0.1");
  });

  it("rounds to 1 decimal place in English", () => {
    expect(formatDistance(1.567, "en")).toBe("1.6");
    expect(formatDistance(1.54, "en")).toBe("1.5");
  });

  it("omits trailing decimal zero for whole numbers", () => {
    expect(formatDistance(10, "en")).toBe("10");
    expect(formatDistance(2, "en")).toBe("2");
  });

  it("uses locale-specific decimal separator (German comma)", () => {
    expect(formatDistance(1.567, "de")).toBe("1,6");
  });

  it("formats large values correctly", () => {
    expect(formatDistance(250, "en")).toBe("250");
    expect(formatDistance(99.95, "en")).toBe("100");
  });
});
