import { describe, expect, it } from "vitest";
import {
  ACTIVITY_LEVELS,
  bmi,
  healthyWeightRange,
  katchMcArdle,
  macros,
  mifflinStJeor,
  palOf,
  referenceWeight,
  targetCalories,
  waterRange,
  weeksToTarget,
  basalRate,
} from "../../src/lib/energy";

/**
 * Mifflin–St Jeor, Am J Clin Nutr 1990:
 * 10·кг + 6.25·см − 5·лет + 5 (мужчины) или −161 (женщины).
 * Katch–McArdle: 370 + 21.6·сухая масса.
 * Дефицит: 7700 ккал на кг жировой ткани (Wishnofsky 1958) / 7.
 * Белок 2.0 / 1.6 / 1.8 г/кг по цели; при ожирении — от веса при ИМТ 25.
 * Жир не ниже 0.8 г/кг. Клетчатка 14 г / 1000 ккал (IOM 2005).
 */

describe("основной обмен", () => {
  it("Mifflin–St Jeor для мужчины и женщины", () => {
    // Мужчина 80 кг, 180 см, 40 лет: 800 + 1125 − 200 + 5 = 1730
    expect(mifflinStJeor({ sex: "male", weight: 80, height: 180, age: 40 })).toBe(1730);
    // Женщина 60 кг, 165 см, 30 лет: 600 + 1031.25 − 150 − 161 = 1320.25
    expect(mifflinStJeor({ sex: "female", weight: 60, height: 165, age: 30 })).toBe(1320.25);
  });

  it("Katch–McArdle считается от сухой массы и подменяет Mifflin, если жир известен", () => {
    // 80 кг, 20% жира: сухая 64 кг → 370 + 21.6·64 = 1752.4
    expect(katchMcArdle(80, 20)).toBeCloseTo(1752.4, 8);
    expect(basalRate({ sex: "male", weight: 80, height: 180, age: 40, bodyFat: 20 })).toEqual({
      value: 1752.4,
      formula: "katch",
    });
    expect(basalRate({ sex: "male", weight: 80, height: 180, age: 40, bodyFat: 2 }).formula).toBe(
      "mifflin",
    );
    expect(basalRate({ sex: "male", weight: 80, height: 180, age: 40, bodyFat: 61 }).formula).toBe(
      "mifflin",
    );
    expect(basalRate({ sex: "female", weight: 60, height: 165, age: 30 }).value).toBe(1320.25);
  });
});

describe("PAL и цель", () => {
  it("умеренный, высокий и спортивный уровни лежат внутри 1.4–2.4", () => {
    expect(palOf("moderate")).toBe(1.55);
    expect(palOf("high")).toBe(1.725);
    expect(palOf("athlete")).toBe(1.9);
    expect(ACTIVITY_LEVELS.map((a) => a.id)).toEqual([
      "sedentary",
      "light",
      "moderate",
      "high",
      "athlete",
    ]);
  });

  it.skip("сидячий и лёгкий PAL не ниже 1.4 — FAO/WHO/UNU 2004", () => {
    // РАСХОЖДЕНИЕ: ожидали PAL в диапазоне 1.4–2.4
    // (FAO/WHO/UNU, Human energy requirements, 2004; тот же диапазон назван в комментарии модуля).
    // Код: sedentary = 1.2, light = 1.375.
    expect(palOf("sedentary")).toBeGreaterThanOrEqual(1.4);
    expect(palOf("light")).toBeGreaterThanOrEqual(1.4);
  });

  it("поддержание не двигает калории, дефицит 0.5%/нед — 440 ккал при 80 кг", () => {
    // 80·0.5/100 = 0.4 кг/нед; 0.4·7700/7 = 440
    expect(
      targetCalories({ tdee: 2500, bmr: 1700, goal: "maintain", ratePercent: 0.5, weight: 80 }),
    ).toEqual({ target: 2500, delta: 0, floored: false, kgPerWeek: 0 });

    const lose = targetCalories({
      tdee: 2500,
      bmr: 1700,
      goal: "lose",
      ratePercent: 0.5,
      weight: 80,
    });
    expect(lose.target).toBeCloseTo(2060, 8);
    expect(lose.delta).toBeCloseTo(-440, 8);
    expect(lose.floored).toBe(false);
    expect(lose.kgPerWeek).toBeCloseTo(0.4, 8);
  });

  it("дефицит упирается в округлённый основной обмен", () => {
    // 100 кг · 1% = 1 кг/нед → 7700/7 = 1100 ккал/день.
    // 2000 − 1100 = 900 < round(1800.5) = 1801.
    // Достижимый темп: |1801−2000|·7/7700 = 0.1809 кг/нед.
    const r = targetCalories({
      tdee: 2000,
      bmr: 1800.5,
      goal: "lose",
      ratePercent: 1,
      weight: 100,
    });
    expect(r.floored).toBe(true);
    expect(r.target).toBe(1801);
    expect(r.delta).toBe(-199);
    expect(r.kgPerWeek).toBeCloseTo((199 * 7) / 7700, 8);
  });

  it("набор прибавляет те же 7700 ккал/кг и не упирается в пол", () => {
    // 80·0.25% = 0.2 кг/нед → 220 ккал/день
    const r = targetCalories({
      tdee: 2500,
      bmr: 1700,
      goal: "gain",
      ratePercent: 0.25,
      weight: 80,
    });
    expect(r.target).toBeCloseTo(2720, 8);
    expect(r.delta).toBeCloseTo(220, 8);
    expect(r.floored).toBe(false);
    expect(r.kgPerWeek).toBeCloseTo(0.2, 8);
  });
});

describe("БЖУ", () => {
  it("белок считается от фактического веса, пока ИМТ не выше 25", () => {
    expect(referenceWeight(70, 175)).toBe(70);
    expect(referenceWeight(100, 170)).toBeCloseTo(25 * 1.7 ** 2, 8);
  });

  it("поддержание: 1.6 г/кг белка и заданная доля жира", () => {
    // 70 кг, 2200 ккал, жир 30%: белок 112 г (448 ккал), жир 660/9 = 73.333 г, углеводы 273 г.
    const m = macros({
      calories: 2200,
      weight: 70,
      height: 175,
      goal: "maintain",
      fatPercent: 30,
    });
    expect(m.squeezed).toBe(false);
    expect(m.protein.grams).toBeCloseTo(112, 8);
    expect(m.protein.kcal).toBeCloseTo(448, 8);
    expect(m.protein.perKg).toBeCloseTo(1.6, 8);
    expect(m.fat.grams).toBeCloseTo(2200 * 0.3 / 9, 8);
    expect(m.fat.share).toBeCloseTo(30, 8);
    expect(m.carbs.grams).toBeCloseTo((2200 - 448 - 660) / 4, 8);
    expect(m.fiber).toBeCloseTo(2.2 * 14, 8);
  });

  it("жир не опускается ниже 0.8 г/кг, даже если процент просит меньше", () => {
    // 10% от 2200 = 24.4 г < 56 г пола
    const m = macros({
      calories: 2200,
      weight: 70,
      height: 175,
      goal: "maintain",
      fatPercent: 10,
    });
    expect(m.fat.grams).toBeCloseTo(56, 8);
    expect(m.carbs.kcal).toBeCloseTo(2200 - 448 - 56 * 9, 8);
    expect(m.squeezed).toBe(false);
  });

  it("при ожирении белок считается от веса ИМТ 25, не от фактического", () => {
    // 120 кг, 170 см: опорный вес 72.25, похудение 2 г/кг → 144.5 г
    const m = macros({
      calories: 1800,
      weight: 120,
      height: 170,
      goal: "lose",
      fatPercent: 30,
    });
    expect(m.protein.grams).toBeCloseTo(2 * 25 * 1.7 ** 2, 8);
    expect(m.protein.perKg).toBeCloseTo(m.protein.grams / 120, 8);
  });

  it.skip("при жёстком дефиците белок урезается, чтобы БЖУ уложились в бюджет", () => {
    // РАСХОЖДЕНИЕ: комментарий macros — если после пола по жиру углеводов не осталось,
    // «урезаем белок». Ожидание: белок + жир + углеводы = 800 ккал.
    // Код оставляет белок 2 г/кг от ИМТ 25 (144.5 г, 578 ккал) и жир на полу
    // 0.8·72.25 = 57.8 г (520.2 ккал), углеводы обнуляет. Сумма ≈ 1098 ккал при бюджете 800.
    const m = macros({
      calories: 800,
      weight: 120,
      height: 170,
      goal: "lose",
      fatPercent: 20,
    });
    expect(m.squeezed).toBe(true);
    expect(m.protein.kcal + m.fat.kcal + m.carbs.kcal).toBeCloseTo(800, 5);
  });
});

describe("сопутствующие ориентиры", () => {
  it("ИМТ, здоровый вес 18.5–25, вода 30–35 мл/кг, недели до цели", () => {
    expect(bmi(70, 175)).toBeCloseTo(70 / 1.75 ** 2, 8);
    const m2 = 1.8 ** 2;
    expect(healthyWeightRange(180)).toEqual([18.5 * m2, 25 * m2]);
    expect(waterRange(80)).toEqual([2400, 2800]);
    expect(weeksToTarget(80, 70, 0.4)).toBe(25);
    expect(weeksToTarget(80, 79.95, 0.4)).toBeNull();
    expect(weeksToTarget(80, 70, 0)).toBeNull();
  });
});
