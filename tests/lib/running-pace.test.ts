import { describe, expect, it } from "vitest";
import {
  RACE_DISTANCES,
  RIEGEL_EXPONENT,
  computePace,
  formatDuration,
  formatPace,
  pacePerKm,
  riegelTime,
  speedKmh,
  toSeconds,
} from "../../src/lib/running-pace";

/**
 * Ригель, 1981: T2 = T1 × (D2 / D1) ^ 1.06.
 * Полумарафон 21.0975 км, марафон 42.195 км.
 */

describe("темп и скорость", () => {
  it("5 км за 25:00 — темп 5:00 и 12 км/ч", () => {
    expect(toSeconds(0, 25, 0)).toBe(1500);
    expect(pacePerKm(5, 1500)).toBe(300);
    expect(speedKmh(5, 1500)).toBe(12);
    expect(formatPace(300)).toBe("5:00");
    expect(formatPace(305)).toBe("5:05");
    expect(formatDuration(1500)).toBe("25:00");
    expect(formatDuration(3661)).toBe("1:01:01");
    expect(pacePerKm(0, 1500)).toBe(0);
    expect(speedKmh(5, 0)).toBe(0);
  });

  it("отрицательные компоненты времени обнуляются", () => {
    expect(toSeconds(-1, 1, -5)).toBe(60);
  });
});

describe("riegelTime", () => {
  it("удвоение дистанции — не удвоение времени", () => {
    // 1500 × 2^1.06 = 3127.397 с
    expect(RIEGEL_EXPONENT).toBe(1.06);
    expect(riegelTime(1500, 5, 10)).toBeCloseTo(1500 * 2 ** 1.06, 6);
    expect(riegelTime(1500, 5, 5)).toBe(1500);
    expect(riegelTime(1500, 0, 10)).toBe(0);
  });

  it("прогноз с 5 км на полумарафон и марафон", () => {
    expect(riegelTime(1500, 5, 21.0975)).toBeCloseTo(1500 * (21.0975 / 5) ** 1.06, 5);
    expect(riegelTime(1500, 5, 42.195)).toBeCloseTo(1500 * (42.195 / 5) ** 1.06, 4);
  });
});

describe("computePace", () => {
  it("собирает темп, скорость и четыре стандартные дистанции", () => {
    const r = computePace(5, 1500);
    expect(r.paceSec).toBe(300);
    expect(r.speed).toBe(12);
    expect(r.predictions.map((p) => p.id)).toEqual(RACE_DISTANCES.map((d) => d.id));
    expect(r.predictions.find((p) => p.id === "5k")!.seconds).toBe(1500);
    expect(r.predictions.find((p) => p.id === "10k")!.seconds).toBeCloseTo(3127.397, 3);
    expect(r.predictions.find((p) => p.id === "half")!.km).toBe(21.0975);
    expect(r.predictions.find((p) => p.id === "marathon")!.km).toBe(42.195);
  });
});
