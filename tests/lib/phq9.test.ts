import { describe, expect, it } from "vitest";
import { PHQ9_MAX, SUICIDE_ITEM, phq9Severity, scorePhq9 } from "../../src/lib/phq9";

/**
 * PHQ-9, Kroenke et al., J Gen Intern Med 2001.
 * 9 пунктов × 0–3, сумма 0–27.
 * 0–4 / 5–9 / 10–14 / 15–19 / 20–27.
 * Отсечка вероятной большой депрессии — ≥10.
 * Пункт 9 (индекс 8) — мысли о смерти; ненулевой ответ значим отдельно от суммы.
 */

describe("PHQ-9", () => {
  it("максимум 27, пропуск пункта — ноль", () => {
    expect(PHQ9_MAX).toBe(27);
    expect(scorePhq9({})).toBe(0);
    expect(scorePhq9({ 0: 2, 8: 1 })).toBe(3);
    const all: Record<number, number> = {};
    for (let i = 0; i < 9; i++) all[i] = 3;
    expect(scorePhq9(all)).toBe(27);
  });

  it("пункт про самоповреждение — девятый, индекс 8", () => {
    expect(SUICIDE_ITEM).toBe(8);
  });

  it("пороги тяжести, включая отсечку 10 и 20", () => {
    expect(phq9Severity(4).key).toBe("minimal");
    expect(phq9Severity(5).key).toBe("mild");
    expect(phq9Severity(9).key).toBe("mild");
    expect(phq9Severity(10).key).toBe("moderate");
    expect(phq9Severity(14).key).toBe("moderate");
    expect(phq9Severity(15).key).toBe("moderatelySevere");
    expect(phq9Severity(19).key).toBe("moderatelySevere");
    expect(phq9Severity(20).key).toBe("severe");
    expect(phq9Severity(27).key).toBe("severe");
  });
});
