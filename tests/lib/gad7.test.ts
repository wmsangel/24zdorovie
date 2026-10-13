import { describe, expect, it } from "vitest";
import { GAD7_MAX, GAD7_ITEMS, gad7Severity, scoreGad7 } from "../../src/lib/gad7";

/**
 * GAD-7, Spitzer et al., Arch Intern Med 2006.
 * 7 пунктов × 0–3, сумма 0–21.
 * 0–4 минимальная, 5–9 лёгкая, 10–14 умеренная, 15–21 тяжёлая.
 * Обычная точка отсечения вероятного ГТР — ≥10.
 */

describe("GAD-7", () => {
  it("максимум 21, пропущенный пункт считается нулём", () => {
    expect(GAD7_ITEMS).toBe(7);
    expect(GAD7_MAX).toBe(21);
    expect(scoreGad7({})).toBe(0);
    expect(scoreGad7({ 0: 3, 6: 3 })).toBe(6);
    expect(scoreGad7({ 0: 3, 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3 })).toBe(21);
  });

  it("пороги тяжести и отсечка 10", () => {
    expect(gad7Severity(0).key).toBe("minimal");
    expect(gad7Severity(4).key).toBe("minimal");
    expect(gad7Severity(5).key).toBe("mild");
    expect(gad7Severity(9).key).toBe("mild");
    expect(gad7Severity(10).key).toBe("moderate");
    expect(gad7Severity(14).key).toBe("moderate");
    expect(gad7Severity(15).key).toBe("severe");
    expect(gad7Severity(21).key).toBe("severe");
  });
});
