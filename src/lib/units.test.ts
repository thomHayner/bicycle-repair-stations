import { describe, it, expect } from "vitest";
import {
  KM_PER_MILE,
  MI_OPTIONS,
  KM_OPTIONS,
  MI_OPTIONS_ALL,
  KM_OPTIONS_ALL,
} from "./units";

describe("KM_PER_MILE", () => {
  it("is approximately 1.60934", () => {
    expect(KM_PER_MILE).toBeCloseTo(1.60934, 4);
  });
});

describe("MI_OPTIONS", () => {
  it("has 7 entries", () => {
    expect(MI_OPTIONS).toHaveLength(7);
  });

  it("starts with 1 and ends with 25", () => {
    expect(MI_OPTIONS[0]).toBe(1);
    expect(MI_OPTIONS[MI_OPTIONS.length - 1]).toBe(25);
  });

  it("is sorted in ascending order", () => {
    const sorted = [...MI_OPTIONS].sort((a, b) => a - b);
    expect([...MI_OPTIONS]).toEqual(sorted);
  });
});

describe("KM_OPTIONS", () => {
  it("has 7 entries", () => {
    expect(KM_OPTIONS).toHaveLength(7);
  });

  it("starts with 1 and ends with 40", () => {
    expect(KM_OPTIONS[0]).toBe(1);
    expect(KM_OPTIONS[KM_OPTIONS.length - 1]).toBe(40);
  });
});

describe("MI_OPTIONS_ALL", () => {
  it("has 10 entries", () => {
    expect(MI_OPTIONS_ALL).toHaveLength(10);
  });

  it("includes 250 as the largest value", () => {
    expect(MI_OPTIONS_ALL).toContain(250);
    expect(MI_OPTIONS_ALL[MI_OPTIONS_ALL.length - 1]).toBe(250);
  });

  it("contains all values from MI_OPTIONS", () => {
    for (const v of MI_OPTIONS) {
      expect(MI_OPTIONS_ALL).toContain(v);
    }
  });
});

describe("KM_OPTIONS_ALL", () => {
  it("has 10 entries", () => {
    expect(KM_OPTIONS_ALL).toHaveLength(10);
  });

  it("includes 400 as the largest value", () => {
    expect(KM_OPTIONS_ALL).toContain(400);
    expect(KM_OPTIONS_ALL[KM_OPTIONS_ALL.length - 1]).toBe(400);
  });

  it("contains all values from KM_OPTIONS", () => {
    for (const v of KM_OPTIONS) {
      expect(KM_OPTIONS_ALL).toContain(v);
    }
  });
});
