import { describe, it, expect } from "vitest";
import { minorFromDollars, dollarsFromMinor, formatMoney } from "../money";

describe("Money primitives", () => {
  it("converts dollars to minor units", () => {
    expect(minorFromDollars(10)).toBe(1000);
    expect(minorFromDollars(10.5)).toBe(1050);
    expect(minorFromDollars(0.01)).toBe(1);
  });

  it("converts minor units to dollars", () => {
    expect(dollarsFromMinor(1000)).toBe(10);
    expect(dollarsFromMinor(1050)).toBe(10.5);
  });

  it("formats money with currency symbol", () => {
    expect(formatMoney(1000)).toBe("$10.00");
    expect(formatMoney(1050)).toBe("$10.50");
  });
});
