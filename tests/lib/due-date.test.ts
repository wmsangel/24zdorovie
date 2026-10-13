import { describe, expect, it } from "vitest";
import { NAEGELE_DAYS, atGestWeek, conceptionDay, dueDate, gestationalAge, trimester } from "../../src/lib/due-date";
import { parseDay } from "../../src/lib/menstrual-cycle";

/**
 * Правило Негеле: ПДР = первый день менструации + 280 дней.
 * При цикле ≠ 28 прибавляется (длина − 28): овуляция сдвигается вместе с родами.
 * Зачатие ≈ за 14 дней до следующей менструации, то есть ПМ + (цикл − 14).
 * 2026 не високосный: 1 января + 280 дней = 8 октября.
 * 2024 високосный: 1 января + 280 дней = 7 октября.
 */

describe("dueDate", () => {
  it("280 дней от 1 января", () => {
    expect(NAEGELE_DAYS).toBe(280);
    expect(dueDate(parseDay("2026-01-01"))).toBe(parseDay("2026-10-08"));
    expect(dueDate(parseDay("2024-01-01"), 28)).toBe(parseDay("2024-10-07"));
  });

  it("цикл 35 дней сдвигает ПДР на неделю", () => {
    // +280 + 7 = 287 дней → 15 октября 2026
    expect(dueDate(parseDay("2026-01-01"), 35)).toBe(parseDay("2026-10-15"));
    expect(dueDate(parseDay("2026-01-01"), 21)).toBe(parseDay("2026-10-01"));
  });

  it("40 недель от ПМ совпадают с ПДР при цикле 28", () => {
    const lmp = parseDay("2026-01-01");
    expect(atGestWeek(lmp, 40)).toBe(dueDate(lmp, 28));
  });
});

describe("conceptionDay", () => {
  it("овуляция за 14 дней до следующей менструации", () => {
    expect(conceptionDay(parseDay("2026-01-01"), 28)).toBe(parseDay("2026-01-15"));
    expect(conceptionDay(parseDay("2026-01-01"), 35)).toBe(parseDay("2026-01-22"));
    expect(conceptionDay(parseDay("2026-01-01"), 21)).toBe(parseDay("2026-01-08"));
  });
});

describe("gestationalAge и триместр", () => {
  it("1 января → 15 марта 2026 это 10 недель и 3 дня", () => {
    // День года 15 марта = 31+28+15 = 74, 1 января = 1, разница 73.
    // 73 = 10·7 + 3.
    const age = gestationalAge(parseDay("2026-01-01"), parseDay("2026-03-15"));
    expect(age).toEqual({ totalDays: 73, weeks: 10, days: 3 });
  });

  it("триместры: до 14, с 14 до 28, с 28", () => {
    expect(trimester(0)).toBe(1);
    expect(trimester(13)).toBe(1);
    expect(trimester(14)).toBe(2);
    expect(trimester(27)).toBe(2);
    expect(trimester(28)).toBe(3);
    expect(trimester(42)).toBe(3);
  });
});
