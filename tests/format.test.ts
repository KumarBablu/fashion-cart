import { describe, it, expect } from "vitest";
import { formatINR, discountPercent } from "@/lib/format";

describe("formatINR", () => {
  it("formats a whole number as Indian Rupees", () => {
    expect(formatINR(899)).toMatch(/₹\s?899/);
  });

  it("accepts a numeric string", () => {
    expect(formatINR("1499")).toMatch(/₹\s?1,499/);
  });
});

describe("discountPercent", () => {
  it("returns null when there is no compare-at price", () => {
    expect(discountPercent(500, null)).toBeNull();
  });

  it("returns null when compare-at price is not higher than price", () => {
    expect(discountPercent(500, 500)).toBeNull();
    expect(discountPercent(500, 400)).toBeNull();
  });

  it("calculates the correct discount percentage", () => {
    expect(discountPercent(750, 1000)).toBe(25);
  });
});
