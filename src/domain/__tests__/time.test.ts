import { describe, it, expect } from "vitest";
import {
  hoursFromMs, msFromHours, formatDuration, formatHours,
  formatHoursDecimal, getWeekRange, formatUTCDate,
} from "../time";

describe("Duration and timestamp primitives", () => {
  describe("hoursFromMs", () => {
    it("converts milliseconds to hours", () => {
      expect(hoursFromMs(3_600_000)).toBe(1);
      expect(hoursFromMs(7_776_000)).toBe(2.16);
      expect(hoursFromMs(0)).toBe(0);
    });
  });

  describe("msFromHours", () => {
    it("converts hours to milliseconds", () => {
      expect(msFromHours(1)).toBe(3_600_000);
      expect(msFromHours(0.5)).toBe(1_800_000);
    });

    it("rounds to integer milliseconds", () => {
      expect(msFromHours(1.23456789)).toBe(4444444);
    });
  });

  describe("formatDuration", () => {
    it("formats as HH:MM:SS", () => {
      expect(formatDuration(3_600_000)).toBe("01:00:00");
      expect(formatDuration(7_740_000)).toBe("02:09:00");
      expect(formatDuration(0)).toBe("00:00:00");
    });

    it("handles partial minutes and seconds", () => {
      expect(formatDuration(3_661_000)).toBe("01:01:01");
    });
  });

  describe("formatHours", () => {
    it("formats hours with 2 decimal places", () => {
      expect(formatHours(3_600_000)).toBe("1.00");
      expect(formatHours(7_740_000)).toBe("2.15");
    });
  });

  describe("formatHoursDecimal", () => {
    it("formats as Xh Ym", () => {
      expect(formatHoursDecimal(3_600_000)).toBe("1h");
      expect(formatHoursDecimal(7_740_000)).toBe("2h 9m");
      expect(formatHoursDecimal(0)).toBe("0h");
    });
  });

  describe("getWeekRange", () => {
    it("returns a Monday to Sunday range", () => {
      const { start, end } = getWeekRange(new Date("2026-10-23T12:00:00Z"));
      expect(start.getUTCDay()).toBe(1);
      expect(end.getUTCDay()).toBe(0);
    });

    it("start is before end", () => {
      const { start, end } = getWeekRange(new Date("2026-10-23T12:00:00Z"));
      expect(start.getTime()).toBeLessThan(end.getTime());
    });
  });

  describe("formatUTCDate", () => {
    it("formats as UTC string", () => {
      const result = formatUTCDate(new Date("2026-10-23T14:30:00Z"));
      expect(result).toBe("2026-10-23 14:30:00 UTC");
    });
  });
});
