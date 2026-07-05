import { describe, it, expect } from "vitest";
import { nearestKarat, fineWeight, tolaRateForKarat, purityPercent, TOLA_TO_GRAM, RATTI_PER_GRAM, KARAT_TABLE } from "./gold";

describe("Gold utility functions", () => {
  it("TOLA_TO_GRAM should be defined", () => {
    expect(TOLA_TO_GRAM).toBe(11.664);
  });

  it("RATTI_PER_GRAM should be defined", () => {
    expect(RATTI_PER_GRAM).toBe(8);
  });

  it("KARAT_TABLE should have entries", () => {
    expect(KARAT_TABLE.length).toBeGreaterThan(0);
    expect(KARAT_TABLE.some(k => k.karat === 24)).toBe(true);
    expect(KARAT_TABLE.some(k => k.karat === 22)).toBe(true);
  });

  describe("nearestKarat", () => {
    it("should find 24K for density 19.3", () => {
      const result = nearestKarat(19.3);
      expect(result.karat).toBe(24);
    });

    it("should find 22K for density 17.5", () => {
      const result = nearestKarat(17.5);
      expect(result.karat).toBe(22);
    });

    it("should find 18K for density 14.0", () => {
      const result = nearestKarat(14.0);
      expect(result.karat).toBe(18);
    });

    it("should find closest match for density between known values", () => {
      const result = nearestKarat(16.0);
      expect([18, 20]).toContain(result.karat);
    });
  });

  describe("fineWeight", () => {
    it("should calculate fine weight for 22K", () => {
      const result = fineWeight(10, 22);
      expect(result).toBeCloseTo(9.1667, 3);
    });

    it("should calculate fine weight for 24K", () => {
      const result = fineWeight(10, 24);
      expect(result).toBe(10);
    });

    it("should calculate fine weight for 18K", () => {
      const result = fineWeight(10, 18);
      expect(result).toBeCloseTo(7.5, 1);
    });

    it("should return 0 for 0 gross weight", () => {
      const result = fineWeight(0, 22);
      expect(result).toBe(0);
    });
  });

  describe("tolaRateForKarat", () => {
    it("should calculate 22K rate from 24K rate", () => {
      const result = tolaRateForKarat(240000, 22);
      expect(result).toBe(220000);
    });

    it("should calculate 18K rate from 24K rate", () => {
      const result = tolaRateForKarat(240000, 18);
      expect(result).toBe(180000);
    });

    it("should return same rate for 24K", () => {
      const result = tolaRateForKarat(240000, 24);
      expect(result).toBe(240000);
    });
  });

  describe("purityPercent", () => {
    it("should calculate 22K purity as 91.67%", () => {
      const result = purityPercent(22);
      expect(result).toBeCloseTo(91.67, 1);
    });

    it("should calculate 24K purity as 100%", () => {
      const result = purityPercent(24);
      expect(result).toBe(100);
    });

    it("should calculate 18K purity as 75%", () => {
      const result = purityPercent(18);
      expect(result).toBe(75);
    });

    it("should calculate 14K purity as 58.33%", () => {
      const result = purityPercent(14);
      expect(result).toBeCloseTo(58.33, 1);
    });
  });
});
