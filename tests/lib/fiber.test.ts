import { describe, expect, it } from "vitest";
import { EFSA_MINIMUM, FIBER_FOODS, FIBER_PER_1000KCAL, fiberNeeds } from "../../src/lib/fiber";

/**
 * IOM 2005, Adequate Intake: мужчины 38 г до 51 года и 30 г после,
 * женщины 25 и 21 г. Альтернатива — 14 г на 1000 ккал.
 * Пол EFSA 2010 — 25 г. Цель — максимум из двух, но не ниже EFSA.
 */

describe("fiberNeeds", () => {
  it("молодой мужчина на 2500 ккал упирается в AI, а не в калории", () => {
    // 14·2.5 = 35 < 38. Разрыв с типичными 16 г — 22.
    const r = fiberNeeds({ sex: "male", age: 40, calories: 2500 });
    expect(r.aiTarget).toBe(38);
    expect(r.calorieTarget).toBe(35);
    expect(r.target).toBe(38);
    expect(r.gap).toBe(22);
  });

  it("после 51 года калорийная норма может обогнать сниженный AI", () => {
    // Мужчина 51+: AI 30, 2500 ккал → 35. Цель 35, разрыв 19.
    const r = fiberNeeds({ sex: "male", age: 51, calories: 2500 });
    expect(r.aiTarget).toBe(30);
    expect(r.calorieTarget).toBe(35);
    expect(r.target).toBe(35);
    expect(r.gap).toBe(19);
  });

  it("женщина 50 лет ещё на «молодой» норме, 51 — уже на старшей", () => {
    expect(fiberNeeds({ sex: "female", age: 50, calories: 1800 }).aiTarget).toBe(25);
    expect(fiberNeeds({ sex: "female", age: 51, calories: 1800 }).aiTarget).toBe(21);
  });

  it("низкая калорийность не опускает цель ниже 25 г EFSA", () => {
    // Женщина 55 лет: AI 21, 1400 ккал → round(19.6) = 20. Цель 25, разрыв 9.
    const r = fiberNeeds({ sex: "female", age: 55, calories: 1400 });
    expect(r.calorieTarget).toBe(20);
    expect(r.target).toBe(EFSA_MINIMUM);
    expect(r.gap).toBe(9);
  });

  it("14 г на 1000 ккал", () => {
    expect(FIBER_PER_1000KCAL).toBe(14);
    expect(fiberNeeds({ sex: "female", age: 30, calories: 3000 }).calorieTarget).toBe(42);
    expect(fiberNeeds({ sex: "female", age: 30, calories: 3000 }).target).toBe(42);
  });
});

describe("FIBER_FOODS", () => {
  it("порции из комментариев USDA", () => {
    const grams = Object.fromEntries(FIBER_FOODS.map((f) => [f.id, f.grams]));
    expect(grams.lentils).toBe(8);
    expect(grams.beans).toBe(7);
    expect(grams.chia).toBe(4);
    expect(grams.wholeBread).toBe(2);
  });
});
