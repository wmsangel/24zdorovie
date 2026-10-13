import { describe, expect, it } from "vitest";
import {
  CYCLE_MINUTES,
  ageBand,
  bedtimesForWake,
  cycleWindow,
  formatTime,
  parseTime,
  sleepDebt,
  wakeTimesForBed,
} from "../../src/lib/sleep-cycles";

/**
 * Цикл 90 минут (Carskadon & Dement, 2011), засыпание по умолчанию 15 минут.
 * Норма NSF / Hirshkowitz 2015: 14–17 лет 8–10 ч, 18–25 и 26–64 лет 7–9 ч, 65+ 7–8 ч.
 */

describe("время", () => {
  it("разбирает и собирает минуты от полуночи, сутки заворачиваются", () => {
    expect(parseTime("23:30")).toBe(23 * 60 + 30);
    expect(parseTime("00:00")).toBe(0);
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(23 * 60 + 59)).toBe("23:59");
    expect(formatTime(1440)).toBe("00:00");
    expect(formatTime(-135)).toBe("21:45");
    expect(parseTime("ab:cd")).toBe(0);
  });
});

describe("циклы", () => {
  it("подъём в 07:00 — отбой за 6…3 цикла по 90 минут плюс 15 минут на засыпание", () => {
    expect(CYCLE_MINUTES).toBe(90);
    const wake = parseTime("07:00");
    const beds = bedtimesForWake(wake);
    // 6·90 + 15 = 555 минут до подъёма → 21:45
    expect(beds.map((b) => b.cycles)).toEqual([6, 5, 4, 3]);
    expect(beds.map((b) => formatTime(b.time))).toEqual(["21:45", "23:15", "00:45", "02:15"]);
    expect(beds[0].sleepMinutes).toBe(540);
    expect(beds[0].time).toBe(wake - 6 * 90 - 15);
  });

  it("отбой в 23:00 — подъёмы от короткого сна к длинному", () => {
    const bed = parseTime("23:00");
    const wakes = wakeTimesForBed(bed);
    expect(wakes.map((w) => w.cycles)).toEqual([3, 4, 5, 6]);
    expect(wakes.map((w) => formatTime(w.time))).toEqual(["03:45", "05:15", "06:45", "08:15"]);
  });

  it("свой цикл и своя латентность", () => {
    const beds = bedtimesForWake(8 * 60, { cycleLength: 100, latency: 20 });
    expect(beds[0].time).toBe(8 * 60 - 6 * 100 - 20);
    expect(beds[0].sleepMinutes).toBe(600);
  });

  it("окно 70–120 минут показывает, насколько «точное» время разъезжается", () => {
    const anchor = parseTime("23:00");
    const forward = cycleWindow(anchor, 4, 15, true);
    // от 4·70 до 4·120 плюс 15 минут засыпания
    expect(forward.from).toBe(anchor + 15 + 4 * 70);
    expect(forward.to).toBe(anchor + 15 + 4 * 120);

    const back = cycleWindow(parseTime("07:00"), 6, 15, false);
    expect(back.from).toBe(7 * 60 - 15 - 6 * 120);
    expect(back.to).toBe(7 * 60 - 15 - 6 * 70);
  });
});

describe("норма и недосып", () => {
  it("возрастные коридоры NSF на границах 18, 26 и 65", () => {
    expect(ageBand(17)).toBe("teen");
    expect(ageBand(18)).toBe("young");
    expect(ageBand(25)).toBe("young");
    expect(ageBand(26)).toBe("adult");
    expect(ageBand(64)).toBe("adult");
    expect(ageBand(65)).toBe("older");
  });

  it("недосып копится от нижней границы нормы", () => {
    // Взрослому нужно минимум 7 ч. 6 ч × 7 ночей = 7 ч за неделю, 1 ч/ночь — significant.
    expect(sleepDebt(6, 30)).toEqual({ weekly: 7, perNight: 1, severity: "significant" });
    expect(sleepDebt(7, 30).severity).toBe("none");
    expect(sleepDebt(6.6, 30).severity).toBe("mild");
    expect(sleepDebt(6.5, 30).severity).toBe("significant");
    expect(sleepDebt(5.5, 30).severity).toBe("severe");
    // Подростку минимум 8 ч: недобор 2 ч/ночь × 7 = 14
    expect(sleepDebt(6, 17)).toEqual({ weekly: 14, perNight: 2, severity: "severe" });
    expect(sleepDebt(6, 30, 3).weekly).toBe(3);
  });
});
