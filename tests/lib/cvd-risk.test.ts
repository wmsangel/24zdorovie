import { describe, expect, it } from "vitest";
import { CHOL_MGDL_TO_MMOL, cvdRisk } from "../../src/lib/cvd-risk";

/**
 * SCORE2, EHJ 2021. Предикторы центрируются так:
 * возраст (age−60)/5, САД (sbp−120)/20, общий ХС − 6, ЛПВП (hdl−1.3)/0.5.
 * Некалиброванный риск = 1 − S0^exp(x), затем
 * 1 − exp(−exp(s1 + s2·ln(−ln(1−uncalibrated)))).
 * Категории ESC 2021 по округлённому проценту:
 * до 50 лет — 2.5% и 7.5%; 50–69 — 5% и 10%.
 */

describe("cvdRisk", () => {
  it("референс 60 лет, все предикторы в центре, низкий регион — 5.0%", () => {
    // x = 0, S0 мужчин = 0.9605 → некалиброванный 0.0395.
    // Шкала low male (−0.5699, 0.7476) → 0.04997 → 5.0%.
    // В 50–69 ровно 5% уже «высокий»: низкий-умеренный строго ниже 5%.
    const r = cvdRisk({
      sex: "male",
      age: 60,
      smoker: false,
      sbp: 120,
      totalChol: 6,
      hdl: 1.3,
      region: "low",
    });
    expect(r).not.toBeNull();
    expect(r!.risk).toBeCloseTo(0.049974, 5);
    expect(r!.percent).toBe(5);
    expect(r!.category).toBe("high");
  });

  it("тот же человек в регионе очень высокого риска — 11.7%, категория veryHigh", () => {
    // Шкала veryHigh male (0.5836, 0.8294) → 0.11745 → 11.7% ≥ 10%.
    const r = cvdRisk({
      sex: "male",
      age: 60,
      smoker: false,
      sbp: 120,
      totalChol: 6,
      hdl: 1.3,
      region: "veryHigh",
    });
    expect(r!.percent).toBe(11.7);
    expect(r!.category).toBe("veryHigh");
  });

  it("женщина 40 лет с низкими факторами — низкий-умеренный риск", () => {
    // Независимый счёт: риск 0.00448 → 0.4% < 2.5%.
    const r = cvdRisk({
      sex: "female",
      age: 40,
      smoker: false,
      sbp: 110,
      totalChol: 4.5,
      hdl: 1.8,
      region: "low",
    });
    expect(r!.risk).toBeCloseTo(0.00448, 5);
    expect(r!.percent).toBe(0.4);
    expect(r!.category).toBe("lowMod");
  });

  it("мужчина 45 лет, умеренный регион — 2.8% попадает в «высокий» до 50 лет", () => {
    // 0.02755 → 2.8%. Порог до 50 лет: ≥2.5% и <7.5% — high.
    const r = cvdRisk({
      sex: "male",
      age: 45,
      smoker: false,
      sbp: 130,
      totalChol: 5.5,
      hdl: 1.3,
      region: "moderate",
    });
    expect(r!.percent).toBe(2.8);
    expect(r!.category).toBe("high");
  });

  it("курящий мужчина 65 лет, очень высокий регион — очень высокий риск", () => {
    // САД 160, ХС 7, ЛПВП 1.0: риск 0.390 → 39% ≥ 10%.
    const r = cvdRisk({
      sex: "male",
      age: 65,
      smoker: true,
      sbp: 160,
      totalChol: 7,
      hdl: 1.0,
      region: "veryHigh",
    });
    expect(r!.risk).toBeCloseTo(0.390036, 5);
    expect(r!.percent).toBe(39);
    expect(r!.category).toBe("veryHigh");
  });

  it("женщина 55 лет, высокий регион, курит — 11% и veryHigh", () => {
    // 0.1101 → 11%. С 50 лет ≥10% — veryHigh.
    const r = cvdRisk({
      sex: "female",
      age: 55,
      smoker: true,
      sbp: 140,
      totalChol: 6.5,
      hdl: 1.2,
      region: "high",
    });
    expect(r!.percent).toBe(11);
    expect(r!.category).toBe("veryHigh");
  });

  it("модель определена только для 40–69 лет", () => {
    const base = {
      sex: "female" as const,
      smoker: false,
      sbp: 120,
      totalChol: 5,
      hdl: 1.4,
      region: "moderate" as const,
    };
    expect(cvdRisk({ ...base, age: 39 })).toBeNull();
    expect(cvdRisk({ ...base, age: 40 })).not.toBeNull();
    expect(cvdRisk({ ...base, age: 69 })).not.toBeNull();
    expect(cvdRisk({ ...base, age: 70 })).toBeNull();
  });
});

describe("CHOL_MGDL_TO_MMOL", () => {
  it("386.65 г/моль → 38.67 мг/дл на 1 ммоль/л", () => {
    expect(CHOL_MGDL_TO_MMOL).toBe(38.67);
    expect(200 / CHOL_MGDL_TO_MMOL).toBeCloseTo(5.172, 3);
  });
});
