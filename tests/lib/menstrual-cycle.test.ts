import { describe, expect, it } from "vitest";
import {
  CONCEPTION_CURVE,
  DEFAULT_LUTEAL,
  FERTILE_AFTER,
  FERTILE_BEFORE,
  GESTATION_DAYS,
  NORMAL_CYCLE,
  cyclePlan,
  forecastCycle,
  parseDay,
  todayDay,
  toIso,
  weekday,
} from "../../src/lib/menstrual-cycle";

/**
 * Правило Огино: овуляция = следующая менструация − лютеиновая фаза.
 * Фертильное окно Wilcox, NEJM 1995: 5 дней до овуляции и 1 день после.
 * От овуляции до родов 266 дней (Негеле минус классические 14).
 * Норма цикла FIGO 2018: 21–35 дней. Нерегулярность — разброс больше 7.
 * Длинные месячные — от 8 дней. Короткая лютеиновая фаза — короче 10.
 */

describe("календарь дней", () => {
  it("1970-01-01 — день 0 и четверг, если понедельник это 0", () => {
    expect(parseDay("1970-01-01")).toBe(0);
    expect(toIso(0)).toBe("1970-01-01");
    expect(weekday(0)).toBe(3);
  });

  it("високосный день и границы года переживают круг parse → iso", () => {
    for (const iso of ["2024-02-29", "2024-01-01", "2026-01-01", "2026-10-08"]) {
      expect(toIso(parseDay(iso))).toBe(iso);
    }
    // 1 января 2024 — понедельник, 1 января 2026 — четверг
    expect(weekday(parseDay("2024-01-01"))).toBe(0);
    expect(weekday(parseDay("2026-01-01"))).toBe(3);
  });

  it("сегодня совпадает с локальной календарной датой", () => {
    const now = new Date();
    const iso = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
    expect(toIso(todayDay())).toBe(iso);
  });
});

describe("forecastCycle", () => {
  const input = {
    lmp: 10_000,
    cycleLength: 28,
    periodLength: 5,
    lutealLength: DEFAULT_LUTEAL,
    variation: 0,
  };

  it("овуляция за 14 дней до следующей менструации, окно 5+1", () => {
    const c = forecastCycle(input, 0);
    expect(c.start).toBe(10_000);
    expect(c.periodEnd).toBe(10_004);
    expect(c.nextStart).toBe(10_028);
    expect(c.ovulation).toBe(10_014);
    expect(c.fertileFrom).toBe(10_014 - FERTILE_BEFORE);
    expect(c.fertileTo).toBe(10_014 + FERTILE_AFTER);
    expect(c.peakFrom).toBe(10_012);
    expect(c.peakTo).toBe(10_014);
    expect(c.testEarliest).toBe(10_026);
    expect(c.dueDate).toBe(10_014 + GESTATION_DAYS);
    expect(c.ovulationFrom).toBe(c.ovulation);
  });

  it("разброс растёт как корень из числа циклов", () => {
    // индекс 3: sqrt(4) = 2, drift = round(4·2) = 8
    const c = forecastCycle({ ...input, variation: 4 }, 3);
    expect(c.start).toBe(10_084);
    expect(c.ovulation).toBe(10_098);
    expect(c.ovulationFrom).toBe(10_090);
    expect(c.ovulationTo).toBe(10_106);
  });
});

describe("cyclePlan", () => {
  const base = {
    lmp: 10_000,
    cycleLength: 28,
    periodLength: 5,
    lutealLength: 14,
    variation: 0,
  };

  it("день 1 — менструация, день овуляции важнее фертильного окна", () => {
    const day1 = cyclePlan({ ...base, today: 10_000 });
    expect(day1.dayOfCycle).toBe(1);
    expect(day1.phase).toBe("menstrual");
    expect(day1.daysToOvulation).toBe(14);
    expect(day1.daysToPeriod).toBe(28);
    expect(day1.flags).toEqual([]);
    expect(day1.fertilityToday).toBe(0);

    const ovulation = cyclePlan({ ...base, today: 10_014 });
    expect(ovulation.phase).toBe("ovulation");
    expect(ovulation.fertilityToday).toBe(CONCEPTION_CURVE[0]);

    const peak = cyclePlan({ ...base, today: 10_013 });
    expect(peak.phase).toBe("fertile");
    expect(peak.fertilityToday).toBe(1);

    const luteal = cyclePlan({ ...base, today: 10_020 });
    expect(luteal.phase).toBe("luteal");
    expect(luteal.daysToOvulation).toBe(-6);
    expect(luteal.fertilityToday).toBe(0);
  });

  it("задержка до 14 дней держит цикл 0, на 15-й день прогноз устаревает", () => {
    const due = cyclePlan({ ...base, today: 10_028 });
    expect(due.phase).toBe("overdue");
    expect(due.overdueDays).toBe(0);
    expect(due.flags).not.toContain("stale");

    const still = cyclePlan({ ...base, today: 10_042 });
    expect(still.phase).toBe("overdue");
    expect(still.overdueDays).toBe(14);

    const rolled = cyclePlan({ ...base, today: 10_043 });
    expect(rolled.phase).not.toBe("overdue");
    expect(rolled.overdueDays).toBeNull();
    expect(rolled.dayOfCycle).toBe(16);
    expect(rolled.flags).toContain("stale");
    expect(rolled.current.start).toBe(10_028);
  });

  it("флаги FIGO на границах нормы", () => {
    expect(NORMAL_CYCLE).toEqual({ min: 21, max: 35 });
    const flags = (patch: Partial<typeof base>) =>
      cyclePlan({ ...base, today: 10_000, ...patch }).flags;

    expect(flags({ cycleLength: 20 })).toContain("shortCycle");
    expect(flags({ cycleLength: 21 })).not.toContain("shortCycle");
    expect(flags({ cycleLength: 35 })).not.toContain("longCycle");
    expect(flags({ cycleLength: 36 })).toContain("longCycle");
    expect(flags({ variation: 7 })).not.toContain("irregular");
    expect(flags({ variation: 8 })).toContain("irregular");
    expect(flags({ periodLength: 7 })).not.toContain("longPeriod");
    expect(flags({ periodLength: 8 })).toContain("longPeriod");
    expect(flags({ lutealLength: 10 })).not.toContain("shortLuteal");
    expect(flags({ lutealLength: 9 })).toContain("shortLuteal");
  });
});
