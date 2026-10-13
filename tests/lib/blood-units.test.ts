import { describe, expect, it } from "vitest";
import {
  convToSi,
  estimatedAverageGlucose,
  getAnalyte,
  round,
  siToConv,
} from "../../src/lib/blood-units";

/**
 * Коэффициенты — молярная масса / 10:
 * холестерин 38.67, триглицериды 88.57, глюкоза 18.02.
 * Мочевая кислота: 1 мг/дл = 59.48 мкмоль/л (168.11 г/моль).
 * Креатинин: 1 мг/дл = 88.42 мкмоль/л (113.12 г/моль).
 * HbA1c NGSP% = IFCC / 10.929 + 2.15.
 * eAG (ADAG): 28.7·A1c% − 46.7 мг/дл.
 */

describe("липидный и углеводный обмен", () => {
  it("холестерин и триглицериды туда и обратно", () => {
    const chol = getAnalyte("total-cholesterol")!;
    const tg = getAnalyte("triglycerides")!;
    expect(siToConv(chol, 1)).toBeCloseTo(38.67, 8);
    expect(convToSi(chol, 200)).toBeCloseTo(200 / 38.67, 8);
    expect(round(siToConv(tg, 1.7), 1)).toBe(150.6);
    expect(convToSi(tg, siToConv(tg, 1.7))).toBeCloseTo(1.7, 8);
  });

  it("глюкоза 5.5 ммоль/л → 99.11 мг/дл", () => {
    const g = getAnalyte("glucose")!;
    expect(siToConv(g, 5.5)).toBeCloseTo(5.5 * 18.02, 8);
    expect(convToSi(g, 99)).toBeCloseTo(99 / 18.02, 8);
  });

  it("HbA1c: 53 ммоль/моль ≈ 7.0%, 39 ммоль/моль ≈ 5.7%", () => {
    const a = getAnalyte("hba1c")!;
    // 53/10.929 + 2.15 = 6.9995
    expect(siToConv(a, 53)).toBeCloseTo(53 / 10.929 + 2.15, 8);
    expect(round(siToConv(a, 39), 1)).toBe(5.7);
    expect(convToSi(a, siToConv(a, 48))).toBeCloseTo(48, 6);
  });
});

describe("мочевая кислота и креатинин", () => {
  it("мкмоль/л ↔ мг/дл", () => {
    const uric = getAnalyte("uric-acid")!;
    const creat = getAnalyte("creatinine")!;
    expect(siToConv(uric, 59.48)).toBeCloseTo(1, 6);
    expect(convToSi(uric, 6)).toBeCloseTo(6 * 59.48, 6);
    expect(siToConv(creat, 88.42)).toBeCloseTo(1, 8);
    expect(convToSi(creat, 1.1)).toBeCloseTo(1.1 * 88.42, 6);
  });
});

describe("estimatedAverageGlucose", () => {
  it("ADAG: 7% → 154.2 мг/дл", () => {
    const e = estimatedAverageGlucose(7);
    expect(e.mgdl).toBeCloseTo(28.7 * 7 - 46.7, 8);
    expect(e.mmol).toBeCloseTo(154.2 / 18.02, 8);
  });

  it("6% → 125.5 мг/дл, таблица ADA округляет это до 126", () => {
    expect(estimatedAverageGlucose(6).mgdl).toBeCloseTo(125.5, 8);
  });
});

describe("round", () => {
  it("убирает хвост двоичной дроби до заданного знака", () => {
    expect(round(1.25, 1)).toBe(1.3);
    expect(round(150.569, 1)).toBe(150.6);
    expect(round(2.5, 0)).toBe(3);
  });
});
