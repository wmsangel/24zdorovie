import { describe, expect, it } from "vitest";
import {
  CONVERT,
  LIFESTYLE_FACTORS,
  lifestyleOffset,
  phenoAge,
  type PhenoAgeInput,
} from "../../src/lib/biological-age";

/**
 * PhenoAge — Levine et al., Aging 2018, таблица 1.
 * xb = −19.9067 − 0.0336·альбумин + 0.0095·креатинин + 0.1953·глюкоза
 *    + 0.0954·ln(СРБ) − 0.012·лимфоциты + 0.0268·MCV + 0.3306·RDW
 *    + 0.00188·ЩФ + 0.0554·лейкоциты + 0.0804·возраст
 * Риск = 1 − exp(−exp(xb)·(exp(120·0.0076927) − 1) / 0.0076927)
 * PhenoAge = 141.50225 + ln(−0.00553·ln(1 − риск)) / 0.09165
 * Единицы: альбумин г/л, креатинин мкмоль/л, глюкоза ммоль/л, СРБ мг/дл.
 */

const FAVORABLE: PhenoAgeInput = {
  age: 50,
  albumin: 45,
  creatinine: 80,
  glucose: 5,
  crp: 0.05,
  lymphocytes: 32,
  mcv: 90,
  rdw: 13,
  alp: 70,
  wbc: 6,
};

const UNFAVORABLE: PhenoAgeInput = {
  age: 50,
  albumin: 35,
  creatinine: 130,
  glucose: 8,
  crp: 1.5,
  lymphocytes: 15,
  mcv: 100,
  rdw: 16,
  alp: 140,
  wbc: 11,
};

describe("phenoAge", () => {
  it("благоприятная панель 50-летнего моложе паспортного возраста", () => {
    // Ручной счёт по формуле выше: 42.523 года
    expect(phenoAge(FAVORABLE)).toBeCloseTo(42.523, 3);
  });

  it("сдвинутые маркеры дают PhenoAge далеко за хронологический возраст", () => {
    // Ручной счёт: 81.735 года
    expect(phenoAge(UNFAVORABLE)).toBeCloseTo(81.735, 3);
  });

  it("нулевой и отрицательный СРБ или возраст не считаются", () => {
    expect(phenoAge({ ...FAVORABLE, crp: 0 })).toBeNull();
    expect(phenoAge({ ...FAVORABLE, crp: -0.1 })).toBeNull();
    expect(phenoAge({ ...FAVORABLE, age: 0 })).toBeNull();
    expect(phenoAge({ ...FAVORABLE, age: -5 })).toBeNull();
  });
});

describe("CONVERT", () => {
  it("переводит традиционные единицы в СИ формулы", () => {
    expect(CONVERT.albuminFromGdl(4.5)).toBe(45);
    expect(CONVERT.creatinineFromMgdl(1)).toBeCloseTo(88.4, 5);
    // 180.16 г/моль → 18.016 мг/дл на 1 ммоль/л; 90 / 18.016 = 4.9956
    expect(CONVERT.glucoseFromMgdl(90)).toBeCloseTo(90 / 18.016, 8);
    expect(CONVERT.crpFromMgl(3)).toBeCloseTo(0.3, 8);
  });
});

describe("lifestyleOffset", () => {
  it("складывает поправки выбранных вариантов", () => {
    const best = lifestyleOffset({
      smoking: "never",
      activity: "high",
      bmi: "normal",
      alcohol: "none",
      diet: "good",
      sleep: "optimal",
      bp: "optimal",
      social: "strong",
    });
    // 0 − 2.5 + 0 + 0 − 1.5 + 0 − 0.5 − 1.5 = −6
    expect(best.total).toBe(-6);

    const worst = lifestyleOffset({
      smoking: "current",
      activity: "sedentary",
      bmi: "obese3",
      alcohol: "heavy",
      diet: "poor",
      sleep: "very-short",
      bp: "high2",
      social: "isolated",
    });
    // 7 + 2 + 8 + 4.5 + 1.5 + 1.5 + 4 + 2 = 30.5
    expect(worst.total).toBe(30.5);
    expect(worst.breakdown).toHaveLength(LIFESTYLE_FACTORS.length);
  });

  it("пропущенный ответ даёт 0, а не ломает сумму", () => {
    const partial = lifestyleOffset({ smoking: "quit-recent" });
    expect(partial.total).toBe(2);
    expect(partial.breakdown.find((b) => b.factor === "diet")).toMatchObject({
      option: null,
      years: 0,
    });
  });
});
