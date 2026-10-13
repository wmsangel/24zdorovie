import { describe, expect, it } from "vitest";
import { FIRST_TRIMESTER, IOM, pregnancyWeightGain, prePregCategory } from "../../src/lib/pregnancy-weight";

/**
 * IOM/NAM 2009, одноплодная беременность.
 * <18.5: 12.5–18 кг, 0.44–0.58 кг/нед.
 * 18.5–24.9: 11.5–16 кг, 0.35–0.50.
 * 25–29.9: 7–11.5 кг, 0.23–0.33.
 * ≥30: 5–9 кг, 0.17–0.27.
 * Первый триместр 0.5–2 кг, дальше темп 2–3 триместров от 13-й недели.
 */

describe("prePregCategory", () => {
  it("пороги ИМТ на росте 160 см", () => {
    const m2 = (160 / 100) ** 2;
    expect(prePregCategory(18.5 * m2 - 0.05, 160)).toBe("underweight");
    expect(prePregCategory(18.5 * m2, 160)).toBe("normal");
    expect(prePregCategory(25 * m2 - 0.05, 160)).toBe("normal");
    expect(prePregCategory(25 * m2, 160)).toBe("overweight");
    expect(prePregCategory(30 * m2 - 0.05, 160)).toBe("overweight");
    expect(prePregCategory(30 * m2, 160)).toBe("obese");
  });
});

describe("pregnancyWeightGain", () => {
  it("нормальный ИМТ: таблица IOM и прибавка к 13-й и 20-й неделе", () => {
    // 60 кг, 165 см: ИМТ = 60 / 1.65² = 22.039
    const r = pregnancyWeightGain(60, 165, 20);
    expect(r.bmi).toBeCloseTo(60 / 1.65 ** 2, 6);
    expect(r.category).toBe("normal");
    expect(r.total).toEqual(IOM.normal.total);
    expect(r.weeklyRate).toEqual([0.35, 0.5]);
    // 7 недель после 13-й: 0.5+0.35·7 = 2.95, 2+0.5·7 = 5.5
    expect(r.expectedByWeek![0]).toBeCloseTo(0.5 + 0.35 * 7, 8);
    expect(r.expectedByWeek![1]).toBeCloseTo(2 + 0.5 * 7, 8);

    const first = pregnancyWeightGain(60, 165, 13);
    expect(first.expectedByWeek).toEqual([0.5, 2]);

    const early = pregnancyWeightGain(60, 165, 1);
    expect(early.expectedByWeek![0]).toBeCloseTo(FIRST_TRIMESTER[0] / 13, 8);
    expect(early.expectedByWeek![1]).toBeCloseTo(FIRST_TRIMESTER[1] / 13, 8);
  });

  it("избыточный вес и ожирение берут свои строки таблицы", () => {
    const m2 = (160 / 100) ** 2;
    expect(pregnancyWeightGain(25 * m2, 160).total).toEqual([7, 11.5]);
    expect(pregnancyWeightGain(30 * m2, 160).weeklyRate).toEqual([0.17, 0.27]);
    expect(pregnancyWeightGain(40, 160).category).toBe("underweight");
    expect(pregnancyWeightGain(40, 160).total).toEqual([12.5, 18]);
  });

  it("без недели нет прогноза, срок длиннее 42 сжимается до 42", () => {
    expect(pregnancyWeightGain(60, 165).expectedByWeek).toBeUndefined();
    const capped = pregnancyWeightGain(60, 165, 50);
    const at42 = pregnancyWeightGain(60, 165, 42);
    expect(capped.expectedByWeek).toEqual(at42.expectedByWeek);
    // 42 − 13 = 29 недель темпа: 0.5+0.35·29 = 10.65, 2+0.5·29 = 16.5
    expect(capped.expectedByWeek![0]).toBeCloseTo(0.5 + 0.35 * 29, 8);
    expect(capped.expectedByWeek![1]).toBeCloseTo(2 + 0.5 * 29, 8);
  });
});
