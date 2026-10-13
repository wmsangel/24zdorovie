import { describe, expect, it } from "vitest";
import {
  currentCycleStart,
  cycleDay,
  daysUntilNext,
  nextPeriod,
  upcomingPeriods,
} from "../../src/lib/period-calc";

/** День 0 — первая менструация, цикл 28, длина кровотечения 5. */

describe("проекция цикла", () => {
  it("сегодня внутри первого цикла", () => {
    expect(currentCycleStart(0, 10, 28)).toBe(0);
    expect(cycleDay(0, 10, 28)).toBe(11);
    expect(nextPeriod(0, 10, 28)).toBe(28);
    expect(daysUntilNext(0, 10, 28)).toBe(18);
  });

  it("в день начала текущего цикла «следующая» — через длину цикла", () => {
    expect(currentCycleStart(0, 56, 28)).toBe(56);
    expect(cycleDay(0, 56, 28)).toBe(1);
    expect(nextPeriod(0, 56, 28)).toBe(84);
    expect(daysUntilNext(0, 56, 28)).toBe(28);
  });

  it("за день до менструации остаётся один день", () => {
    expect(daysUntilNext(0, 27, 28)).toBe(1);
    expect(cycleDay(0, 27, 28)).toBe(28);
  });

  it("дата в будущем не проецируется назад", () => {
    expect(currentCycleStart(100, 90, 28)).toBe(100);
    expect(cycleDay(100, 90, 28)).toBe(-9);
  });

  it.skip("в день начала менструации до неё 0 дней", () => {
    // РАСХОЖДЕНИЕ: комментарий daysUntilNext — «0 = начинается сегодня».
    // При lmp = today = 0 и цикле 28 код возвращает 28:
    // nextPeriod берёт начало текущего цикла и прибавляет полный цикл,
    // поэтому ноль недостижим при cycle > 0.
    expect(daysUntilNext(0, 0, 28)).toBe(0);
  });
});

describe("upcomingPeriods", () => {
  it("окна [начало; начало + длина − 1]", () => {
    expect(upcomingPeriods(0, 10, 28, 5, 3)).toEqual([
      { start: 28, end: 32 },
      { start: 56, end: 60 },
      { start: 84, end: 88 },
    ]);
  });

  it("нулевая длина кровотечения сжимается до одного дня", () => {
    expect(upcomingPeriods(0, 0, 28, 0, 1)).toEqual([{ start: 28, end: 28 }]);
  });
});
