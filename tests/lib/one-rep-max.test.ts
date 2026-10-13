import { describe, expect, it } from "vitest";
import { brzycki, epley, lombardi, oneRepMax, REP_PERCENT } from "../../src/lib/one-rep-max";

/**
 * Epley: w·(1 + reps/30).
 * Brzycki: w·36 / (37 − reps).
 * Lombardi: w·reps^0.10.
 * Доли повторений — таблица NSCA/Baechle.
 */

describe("формулы 1ПМ", () => {
  it("100 кг на 5 повторов", () => {
    expect(epley(100, 5)).toBeCloseTo(100 * (1 + 5 / 30), 8);
    expect(brzycki(100, 5)).toBeCloseTo((100 * 36) / 32, 8);
    expect(lombardi(100, 5)).toBeCloseTo(100 * 5 ** 0.1, 8);
  });

  it("на 10 повторах Эпли и Бжицки сходятся, Ломбарди ниже", () => {
    expect(epley(100, 10)).toBeCloseTo(100 * (1 + 10 / 30), 8);
    expect(brzycki(100, 10)).toBeCloseTo((100 * 36) / 27, 8);
    expect(epley(100, 10)).toBeCloseTo(brzycki(100, 10), 8);
    expect(lombardi(100, 10)).toBeCloseTo(100 * 10 ** 0.1, 8);
    expect(lombardi(100, 10)).toBeLessThan(epley(100, 10));
  });

  it("один повтор: Бжицки и Ломбарди возвращают сам вес, Эпли — нет", () => {
    expect(brzycki(80, 1)).toBeCloseTo(80, 8);
    expect(lombardi(80, 1)).toBeCloseTo(80, 8);
    // w·(1 + 1/30) = w·31/30
    expect(epley(80, 1)).toBeCloseTo(80 * (31 / 30), 8);
  });
});

describe("oneRepMax", () => {
  it("усредняет три формулы и раскладывает цели по таблице NSCA", () => {
    const e = 100 * (1 + 5 / 30);
    const b = (100 * 36) / 32;
    const l = 100 * 5 ** 0.1;
    const avg = (e + b + l) / 3;

    const r = oneRepMax(100, 5);
    expect(r.lowConfidence).toBe(false);
    expect(r.formulas.map((f) => f.id)).toEqual(["epley", "brzycki", "lombardi"]);
    expect(r.average).toBeCloseTo(avg, 8);
    expect(r.targets.find((t) => t.reps === 5)).toMatchObject({ percent: 87 });
    expect(r.targets.find((t) => t.reps === 5)!.weight).toBeCloseTo((avg * 87) / 100, 8);
    expect(r.targets.find((t) => t.reps === 1)!.weight).toBeCloseTo(avg, 8);
  });

  it("фактический одиночный подход не прогоняется через формулы", () => {
    const r = oneRepMax(100, 1);
    expect(r.formulas).toEqual([{ id: "actual", name: "Фактический подход", oneRm: 100 }]);
    expect(r.average).toBe(100);
    expect(r.lowConfidence).toBe(false);
  });

  it("таблица NSCA и порог ненадёжности после 10 повторов", () => {
    expect(REP_PERCENT).toEqual({
      1: 100,
      2: 95,
      3: 93,
      4: 90,
      5: 87,
      6: 85,
      8: 80,
      10: 75,
      12: 67,
      15: 65,
    });
    expect(oneRepMax(60, 10).lowConfidence).toBe(false);
    expect(oneRepMax(60, 11).lowConfidence).toBe(true);
  });

  it("ноль повторов сжимается до факта, выше 36 — до знаменателя Бжицки", () => {
    expect(oneRepMax(90, 0).average).toBe(90);
    const clamped = oneRepMax(100, 40);
    expect(clamped.lowConfidence).toBe(true);
    expect(clamped.formulas.find((f) => f.id === "brzycki")!.oneRm).toBeCloseTo((100 * 36) / 1, 8);
  });
});
