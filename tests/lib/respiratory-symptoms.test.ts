import { describe, expect, it } from "vitest";
import { PATTERN_SYMPTOMS, RED_FLAGS, matchSymptoms } from "../../src/lib/respiratory-symptoms";

/**
 * Веса паттернов заданы в модуле по типичной картине CDC/NHS (не клиническая шкала).
 * Лидер показывается только при ≥3 симптомах и отрыве ≥15% суммы баллов.
 * Красные флаги в баллах не участвуют.
 */

describe("matchSymptoms", () => {
  it("пусто — ничья без лидера", () => {
    const r = matchSymptoms([]);
    expect(r.scores).toEqual({ cold: 0, flu: 0, covid: 0 });
    expect(r.shares).toEqual({ cold: 0, flu: 0, covid: 0 });
    expect(r.leading).toBeNull();
    expect(r.tooClose).toBe(true);
    expect(r.selectedCount).toBe(0);
  });

  it("лихорадка, внезапное начало и ломота тянут к гриппу", () => {
    // cold 0+0+1 = 1, flu 3+3+3 = 9, covid 2+1+2 = 5, сумма 15.
    // (9−5)/15 = 0.267 ≥ 0.15, симптомов 3 → лидер flu.
    const r = matchSymptoms(["fever", "suddenOnset", "bodyAches"]);
    expect(r.scores).toEqual({ cold: 1, flu: 9, covid: 5 });
    expect(r.shares.flu).toBeCloseTo(9 / 15, 8);
    expect(r.shares.cold + r.shares.flu + r.shares.covid).toBeCloseTo(1, 8);
    expect(r.tooClose).toBe(false);
    expect(r.leading).toBe("flu");
  });

  it("насморк, чихание и боль в горле — простуда", () => {
    // cold 3+3+2 = 8, flu 0+1+1 = 2, covid 1+1+2 = 4, сумма 14. Отрыв 4/14.
    const r = matchSymptoms(["sneezing", "runnyNose", "soreThroat"]);
    expect(r.scores).toEqual({ cold: 8, flu: 2, covid: 4 });
    expect(r.leading).toBe("cold");
    expect(r.tooClose).toBe(false);
  });

  it("потеря обоняния с кашлем и усталостью — COVID, если отрыв достаточный", () => {
    // dryCough 1/2/3, fatigue 1/3/2, lossSmell 1/0/3.
    // cold 3, flu 5, covid 8, сумма 16. (8−5)/16 = 0.1875 ≥ 0.15.
    const r = matchSymptoms(["dryCough", "fatigue", "lossSmell"]);
    expect(r.scores).toEqual({ cold: 3, flu: 5, covid: 8 });
    expect(r.leading).toBe("covid");
  });

  it("три симптома с отрывом меньше 15% лидера не назначают", () => {
    // fever 0/3/2, fatigue 1/3/2, headache 1/2/2.
    // cold 2, flu 8, covid 6, сумма 16. (8−6)/16 = 0.125 < 0.15.
    const r = matchSymptoms(["fever", "fatigue", "headache"]);
    expect(r.scores).toEqual({ cold: 2, flu: 8, covid: 6 });
    expect(r.tooClose).toBe(true);
    expect(r.leading).toBeNull();
  });

  it("двух ясных симптомов мало для лидера", () => {
    const r = matchSymptoms(["lossSmell", "dryCough"]);
    expect(r.selectedCount).toBe(2);
    expect(r.leading).toBeNull();
  });

  it("красный флаг не добавляет баллов паттерну", () => {
    const withFlag = matchSymptoms(["fever", "suddenOnset", "bodyAches", "troubleBreathing"]);
    const plain = matchSymptoms(["fever", "suddenOnset", "bodyAches"]);
    expect(withFlag.scores).toEqual(plain.scores);
    expect(RED_FLAGS).toContain("troubleBreathing");
    expect(PATTERN_SYMPTOMS.some((s) => s.id === "troubleBreathing")).toBe(false);
  });
});
