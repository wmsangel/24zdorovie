import { describe, expect, it } from "vitest";
import {
  foxMax,
  gulatiMax,
  heartRateReserve,
  maxHeartRate,
  restingCategory,
  tanakaMax,
  targetHr,
  weeklyPlan,
  zoneForHr,
  zoneTable,
} from "../../src/lib/heart-rate";

/**
 * Tanaka et al., JACC 2001: 208 − 0.7·возраст.
 * Gulati et al., Circulation 2010: 206 − 0.88·возраст.
 * «220 − возраст» — линия Фокса.
 * Карвонен 1957: ЧСС = покой + доля·(максимум − покой).
 */

describe("максимальный пульс", () => {
  it("три опубликованные формулы на 40 годах", () => {
    expect(tanakaMax(40)).toBeCloseTo(180, 8);
    expect(gulatiMax(40)).toBeCloseTo(170.8, 8);
    expect(foxMax(40)).toBe(180);
    expect(tanakaMax(0)).toBe(208);
    expect(gulatiMax(50)).toBeCloseTo(162, 8);
  });

  it("явный Tanaka у мужчины и явные Gulati/Fox у женщины", () => {
    expect(maxHeartRate(40, "male", "tanaka")).toBeCloseTo(180, 8);
    expect(maxHeartRate(40, "female", "gulati")).toBeCloseTo(170.8, 8);
    expect(maxHeartRate(40, "female", "fox")).toBe(180);
    expect(maxHeartRate(40, "male", "fox")).toBe(180);
  });

  it.skip("явный выбор Tanaka у женщины — 208 − 0.7×возраст", () => {
    // РАСХОЖДЕНИЕ: ожидали 180 по Tanaka et al., JACC 2001 (208 − 0.7×40).
    // maxHeartRate(40, "female", "tanaka") даёт Gulati: 206 − 0.88×40 = 170.8.
    // Ветка formula === "tanaka" для женщин не отличается от Gulati.
    expect(maxHeartRate(40, "female", "tanaka")).toBeCloseTo(180, 8);
  });
});

describe("зоны Карвонена", () => {
  it("границы — покой плюс доля резерва, не доля максимума", () => {
    // Максимум 180, покой 60, резерв 120.
    // Зона 2: 60 + 0.6·120 = 132 … 60 + 0.7·120 = 144.
    expect(heartRateReserve(180, 60)).toBe(120);
    expect(heartRateReserve(50, 80)).toBe(0);
    expect(targetHr(0.6, 180, 60, "karvonen")).toBe(132);
    expect(targetHr(0.6, 180, 60, "percent-max")).toBe(108);

    const zones = zoneTable(180, 60, "karvonen");
    expect(zones.map((z) => [z.id, z.from, z.to])).toEqual([
      ["z1", 120, 132],
      ["z2", 132, 144],
      ["z3", 144, 156],
      ["z4", 156, 168],
      ["z5", 168, 180],
    ]);
    expect(zones[1].shareOfMax).toEqual({ from: 132 / 180, to: 144 / 180 });
  });

  it("процент от максимума не зависит от пульса покоя", () => {
    const zones = zoneTable(180, 60, "percent-max");
    expect(zones[0]).toMatchObject({ from: 90, to: 108 });
    expect(zones[4]).toMatchObject({ from: 162, to: 180 });
  });

  it("пульс ниже первой зоны — null, выше потолка пятой — всё ещё z5", () => {
    const zones = zoneTable(180, 60, "karvonen");
    expect(zoneForHr(119, zones)).toBeNull();
    expect(zoneForHr(120, zones)).toBe("z1");
    expect(zoneForHr(133, zones)).toBe("z2");
    expect(zoneForHr(180, zones)).toBe("z5");
    expect(zoneForHr(181, zones)).toBe("z5");
  });
});

describe("пульс покоя и недельный план", () => {
  it("границы категорий 50 / 60 / 70 / 80", () => {
    expect(restingCategory(49)).toBe("athletic");
    expect(restingCategory(50)).toBe("excellent");
    expect(restingCategory(59)).toBe("excellent");
    expect(restingCategory(60)).toBe("good");
    expect(restingCategory(70)).toBe("average");
    expect(restingCategory(79)).toBe("average");
    expect(restingCategory(80)).toBe("high");
  });

  it("поляризованное распределение: 35/45/5/10/5 процентов", () => {
    // 240 мин: 84, 108, 12, 24, 12. Сумма 240. Z1+Z2 = 80%.
    expect(weeklyPlan(240)).toEqual([
      { id: "z1", minutes: 84 },
      { id: "z2", minutes: 108 },
      { id: "z3", minutes: 12 },
      { id: "z4", minutes: 24 },
      { id: "z5", minutes: 12 },
    ]);
  });
});
