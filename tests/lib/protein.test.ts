import { describe, expect, it } from "vitest";
import { PROTEIN_FOODS, proteinNeeds } from "../../src/lib/protein";

/**
 * г/кг: сидячие 0.8–1.0 (WHO/FAO 2007), активные и выносливость 1.2–1.6 (ISSN 2017),
 * силовые 1.6–2.2 (Morton 2018, плато около 1.6).
 * Цель: похудение +0.3 (Helms 2014), набор +0.2.
 * После 65 лет низ не ниже 1.0, верх не ниже 1.2 (PROT-AGE).
 * Округление до 5 г. Порция около 0.4 г/кг, приёмов 3–6.
 */

describe("proteinNeeds", () => {
  it("сидячий взрослый на поддержании", () => {
    // 70 кг: 56 и 70 г → округление 55 и 70, середина 62.5 → 65.
    // Порция max(20, round5(28)) = 30; приёмов round(65/30)=2 → не меньше 3.
    // На приём round5(65/3)=20.
    const r = proteinNeeds({
      weight: 70,
      age: 30,
      sex: "male",
      activity: "sedentary",
      goal: "maintain",
    });
    expect(r.perKg).toEqual([0.8, 1.0]);
    expect(r.low).toBe(55);
    expect(r.high).toBe(70);
    expect(r.mid).toBe(65);
    expect(r.meals).toBe(3);
    expect(r.perMeal).toBe(20);
  });

  it("силовая работа и похудение сдвигают оба края на +0.3", () => {
    // 80 кг: 1.9–2.5 г/кг → 152 и 200 г; 152 округляется до 150.
    const r = proteinNeeds({
      weight: 80,
      age: 40,
      sex: "female",
      activity: "strength",
      goal: "lose",
    });
    expect(r.perKg[0]).toBeCloseTo(1.9, 8);
    expect(r.perKg[1]).toBeCloseTo(2.5, 8);
    expect(r.low).toBe(150);
    expect(r.high).toBe(200);
    // середина 175 уже кратна 5
    expect(r.mid).toBe(175);
  });

  it("после 65 лет сидячий диапазон поднимается до 1.0–1.2", () => {
    const young = proteinNeeds({
      weight: 50,
      age: 64,
      sex: "female",
      activity: "sedentary",
      goal: "maintain",
    });
    const older = proteinNeeds({
      weight: 50,
      age: 65,
      sex: "female",
      activity: "sedentary",
      goal: "maintain",
    });
    expect(young.perKg).toEqual([0.8, 1.0]);
    expect(older.perKg).toEqual([1.0, 1.2]);
    expect(older.low).toBe(50);
    expect(older.high).toBe(60);
  });

  it("похудение у пожилого не опускает уже сдвинутый диапазон", () => {
    // 0.8+0.3=1.1 и 1.0+0.3=1.3 — оба выше пола 1.0/1.2
    const r = proteinNeeds({
      weight: 60,
      age: 70,
      sex: "male",
      activity: "sedentary",
      goal: "lose",
    });
    expect(r.perKg).toEqual([1.1, 1.3]);
    // 66 → 65, 78 → 80, середина 72.5 → 75
    expect(r.low).toBe(65);
    expect(r.high).toBe(80);
    expect(r.mid).toBe(75);
  });

  it("набор при силовой работе: 1.8–2.4 г/кг", () => {
    const r = proteinNeeds({
      weight: 80,
      age: 30,
      sex: "male",
      activity: "strength",
      goal: "gain",
    });
    expect(r.perKg[0]).toBeCloseTo(1.8, 8);
    expect(r.perKg[1]).toBeCloseTo(2.4, 8);
    // 144 → 145, 192 → 190
    expect(r.low).toBe(145);
    expect(r.high).toBe(190);
  });
});

describe("PROTEIN_FOODS", () => {
  it("порции совпадают с округлением USDA из комментариев", () => {
    const grams = Object.fromEntries(PROTEIN_FOODS.map((f) => [f.id, f.grams]));
    expect(grams.chickenBreast).toBe(31);
    expect(grams.cottage).toBe(17);
    expect(grams.eggs).toBe(13);
    expect(grams.whey).toBe(24);
  });
});
