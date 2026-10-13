import { describe, expect, it } from "vitest";
import { formulaWeight, idealWeight, IDEAL_FORMULAS } from "../../src/lib/ideal-weight";

/**
 * Классические формулы идеального веса: база + коэффициент × дюймы свыше 5 футов (152.4 см).
 * Devine 1974: 50 / 45.5 + 2.3.
 * Robinson 1983: 52 + 1.9 и 49 + 1.7.
 * Miller 1983: 56.2 + 1.41 и 53.1 + 1.36.
 * Hamwi 1964: 48 + 2.7 и 45.5 + 2.2.
 * Здоровый диапазон — ИМТ 18.5–24.9.
 */

const INCH = (180 - 152.4) / 2.54;

describe("idealWeight", () => {
  it("мужчина 180 см: четыре формулы и их среднее", () => {
    const devine = 50 + 2.3 * INCH;
    const robinson = 52 + 1.9 * INCH;
    const miller = 56.2 + 1.41 * INCH;
    const hamwi = 48 + 2.7 * INCH;

    const r = idealWeight("male", 180);
    expect(r.formulas.map((f) => f.kg)).toEqual([
      expect.closeTo(devine, 8),
      expect.closeTo(robinson, 8),
      expect.closeTo(miller, 8),
      expect.closeTo(hamwi, 8),
    ]);
    expect(r.clinicalAverage).toBeCloseTo((devine + robinson + miller + hamwi) / 4, 8);
    expect(r.healthyLow).toBeCloseTo(18.5 * 1.8 * 1.8, 8);
    expect(r.healthyHigh).toBeCloseTo(24.9 * 1.8 * 1.8, 8);
  });

  it("ровно 5 футов — одни базы, и они разные у мужчин и женщин", () => {
    const male = idealWeight("male", 152.4);
    const female = idealWeight("female", 152.4);
    expect(male.formulas.map((f) => f.kg)).toEqual([50, 52, 56.2, 48]);
    expect(female.formulas.map((f) => f.kg)).toEqual([45.5, 49, 53.1, 45.5]);
    expect(female.clinicalAverage).toBeCloseTo((45.5 + 49 + 53.1 + 45.5) / 4, 8);
    expect(male.healthyLow).toBeCloseTo(18.5 * 1.524 ** 2, 6);
  });

  it("ниже 5 футов дюймы отрицательные — формула всё равно линейная", () => {
    const f = IDEAL_FORMULAS[0];
    const inches = (150 - 152.4) / 2.54;
    expect(formulaWeight(f, "female", 150)).toBeCloseTo(45.5 + 2.3 * inches, 8);
  });
});
