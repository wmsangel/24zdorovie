import { describe, expect, it } from "vitest";
import {
  CLIMATE_BONUS,
  EFSA_TOTAL,
  FOOD_SHARE,
  IOM_TOTAL,
  MAX_HOURLY_INTAKE,
  SWEAT_RATES,
  baselineWater,
  hydrationNeeds,
  mlPerKg,
} from "../../src/lib/hydration";

/**
 * EFSA 2010: мужчины 2500 мл, женщины 2000 мл; беременность +300, лактация +700.
 * Ориентир 30–35 мл/кг (ESPEN): до 30 лет 35, 30–55 лет 33, старше 30.
 * Доля воды из еды 22% внутри оценки EFSA 20–30%.
 */

describe("база и константы", () => {
  it("EFSA и IOM по полу", () => {
    expect(EFSA_TOTAL).toEqual({ male: 2500, female: 2000 });
    expect(IOM_TOTAL).toEqual({ male: 3700, female: 2700 });
    expect(FOOD_SHARE).toBe(0.22);
    expect(MAX_HOURLY_INTAKE).toBe(800);
    expect(SWEAT_RATES).toEqual({ light: 400, moderate: 700, intense: 1200 });
    expect(CLIMATE_BONUS.hot).toBe(500);
    expect(CLIMATE_BONUS.veryHot).toBe(1000);
  });

  it("мл/кг снижается на границах 30 и 55 лет", () => {
    expect(mlPerKg(29)).toBe(35);
    expect(mlPerKg(30)).toBe(33);
    expect(mlPerKg(55)).toBe(33);
    expect(mlPerKg(56)).toBe(30);
    expect(baselineWater(70, 40)).toBe(70 * 33);
  });
});

describe("hydrationNeeds", () => {
  it("мужчина без нагрузки: только база, 22% из еды", () => {
    const r = hydrationNeeds({
      sex: "male",
      weight: 70,
      age: 40,
      exerciseMinutes: 0,
      intensity: "moderate",
      climate: "temperate",
      wakingHours: 16,
    });
    // 70·33 = 2310; еда 508.2; питьё 1801.8; в час 112.6125; стаканов 7.2072
    expect(r.total).toBe(2310);
    expect(r.fromFood).toBeCloseTo(2310 * 0.22, 8);
    expect(r.fromDrinks).toBeCloseTo(2310 * 0.78, 8);
    expect(r.perHour).toBeCloseTo((2310 * 0.78) / 16, 8);
    expect(r.glasses).toBeCloseTo((2310 * 0.78) / 250, 8);
    expect(r.reference).toBe(2500);
    expect(r.farFromReference).toBe(false);
    expect(r.exceedsHourlyLimit).toBe(false);
    expect(r.breakdown).toEqual([{ id: "base", ml: 2310 }]);
  });

  it("женщина: нагрузка, жара и беременность складываются", () => {
    const r = hydrationNeeds({
      sex: "female",
      weight: 60,
      age: 28,
      exerciseMinutes: 30,
      intensity: "moderate",
      climate: "hot",
      wakingHours: 16,
      stage: "pregnant",
    });
    // 60·35 = 2100; пот 0.5·700 = 350; жара 500; беременность 300; итого 3250
    expect(r.total).toBe(3250);
    expect(r.fromDrinks).toBeCloseTo(3250 * 0.78, 8);
    expect(r.reference).toBe(2000);
    // 3250 > 2000·1.5
    expect(r.farFromReference).toBe(true);
    expect(r.breakdown).toEqual([
      { id: "base", ml: 2100 },
      { id: "exercise", ml: 350 },
      { id: "climate", ml: 500 },
      { id: "stage", ml: 300 },
    ]);
  });

  it("надбавка беременности не начисляется мужчине, нулевые часы бодрствования сжимаются до 1", () => {
    const r = hydrationNeeds({
      sex: "male",
      weight: 70,
      age: 40,
      exerciseMinutes: 0,
      intensity: "light",
      climate: "cool",
      wakingHours: 0,
      stage: "breastfeeding",
    });
    expect(r.total).toBe(2310);
    expect(r.perHour).toBeCloseTo(2310 * 0.78, 8);
    expect(r.breakdown.map((b) => b.id)).not.toContain("stage");
  });

  it("лактация +700 и очень жаркий климат +1000", () => {
    const r = hydrationNeeds({
      sex: "female",
      weight: 60,
      age: 56,
      exerciseMinutes: 60,
      intensity: "intense",
      climate: "veryHot",
      wakingHours: 2,
      stage: "breastfeeding",
    });
    // возраст 56 → 30 мл/кг: 1800 + 1200 + 1000 + 700 = 4700
    // питьё 3666 / 2 ч = 1833 > 800
    expect(r.total).toBe(4700);
    expect(r.exceedsHourlyLimit).toBe(true);
    expect(mlPerKg(56)).toBe(30);
  });
});
