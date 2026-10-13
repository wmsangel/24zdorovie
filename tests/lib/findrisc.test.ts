import { describe, expect, it } from "vitest";
import {
  FINDRISC_CATEGORIES,
  FINDRISC_MAX,
  FINDRISC_POINTS,
  findriscCategory,
  scoreFindrisc,
} from "../../src/lib/findrisc";

/**
 * FINDRISC, Lindström & Tuomilehto, Diabetes Care 2003,
 * пороги Finnish Diabetes Association: <7, 7–11, 12–14, 15–20, >20.
 * Баллы: возраст 0/2/3/4, ИМТ 0/1/3, талия 0/3/4, активность 0/2,
 * овощи 0/1, лекарства 0/2, гипергликемия 0/5, родня 0/3/5. Максимум 26.
 */

describe("scoreFindrisc", () => {
  it("сумма по индексам вариантов, пропуск и чужой индекс дают 0", () => {
    expect(scoreFindrisc({})).toBe(0);
    expect(
      scoreFindrisc({
        age: 2,
        bmi: 1,
        waist: 2,
        activity: 1,
        diet: 0,
        meds: 1,
        highGlucose: 0,
        family: 2,
      }),
    ).toBe(3 + 1 + 4 + 2 + 0 + 2 + 0 + 5);
    expect(scoreFindrisc({ age: 99, bmi: 1 })).toBe(1);
  });

  it("максимум 4+3+4+2+1+2+5+5 = 26 и не зависит от пола", () => {
    expect(FINDRISC_MAX).toBe(26);
    expect(Math.max(...FINDRISC_POINTS.age)).toBe(4);
    const allMax = scoreFindrisc({
      age: 3,
      bmi: 2,
      waist: 2,
      activity: 1,
      diet: 1,
      meds: 1,
      highGlucose: 1,
      family: 2,
    });
    expect(allMax).toBe(26);
  });
});

describe("findriscCategory", () => {
  it("границы категорий включительны снизу", () => {
    expect(findriscCategory(0).key).toBe("low");
    expect(findriscCategory(6).key).toBe("low");
    expect(findriscCategory(7).key).toBe("slightlyElevated");
    expect(findriscCategory(11).key).toBe("slightlyElevated");
    expect(findriscCategory(12).key).toBe("moderate");
    expect(findriscCategory(14).key).toBe("moderate");
    expect(findriscCategory(15).key).toBe("high");
    expect(findriscCategory(20).key).toBe("high");
    expect(findriscCategory(21).key).toBe("veryHigh");
    expect(findriscCategory(26).key).toBe("veryHigh");
  });

  it("10-летние риски совпадают с публикацией шкалы", () => {
    const byKey = Object.fromEntries(FINDRISC_CATEGORIES.map((c) => [c.key, c.riskEn]));
    expect(byKey.low).toBe("≈ 1 in 100 (~1%)");
    expect(byKey.slightlyElevated).toBe("≈ 1 in 25 (~4%)");
    expect(byKey.moderate).toBe("≈ 1 in 6 (~17%)");
    expect(byKey.high).toBe("≈ 1 in 3 (~33%)");
    expect(byKey.veryHigh).toBe("≈ 1 in 2 (~50%)");
  });
});
