/**
 * «Идеальный вес»: здоровый диапазон по ИМТ + классические клинические формулы.
 *
 * Ключевая мысль (и она вынесена в интерфейс): единственной «идеальной» цифры
 * не существует. Доказательный ориентир — диапазон здорового веса из ИМТ
 * 18,5–24,9, а не одно число. Старые формулы (Devine и др.) созданы в основном
 * для расчёта доз лекарств, дают одну точку и игнорируют долю мышц и телосложение —
 * поэтому показываем их прозрачно, как исторический ориентир, а не как цель.
 *
 * Все формулы заданы для роста в дюймах свыше 5 футов (152,4 см):
 *   inches = (см − 152.4) / 2.54
 */
export type Sex = "male" | "female";

const CM_PER_INCH = 2.54;
const FIVE_FEET_CM = 152.4;

export type IdealFormula = {
  id: string;
  name: string;
  year: number;
  /** base + perInch × дюймы свыше 5 футов */
  base: Record<Sex, number>;
  perInch: Record<Sex, number>;
};

export const IDEAL_FORMULAS: IdealFormula[] = [
  { id: "devine", name: "Devine", year: 1974, base: { male: 50, female: 45.5 }, perInch: { male: 2.3, female: 2.3 } },
  { id: "robinson", name: "Robinson", year: 1983, base: { male: 52, female: 49 }, perInch: { male: 1.9, female: 1.7 } },
  { id: "miller", name: "Miller", year: 1983, base: { male: 56.2, female: 53.1 }, perInch: { male: 1.41, female: 1.36 } },
  { id: "hamwi", name: "Hamwi", year: 1964, base: { male: 48, female: 45.5 }, perInch: { male: 2.7, female: 2.2 } },
];

export function formulaWeight(f: IdealFormula, sex: Sex, heightCm: number): number {
  const inchesOver5ft = (heightCm - FIVE_FEET_CM) / CM_PER_INCH;
  return f.base[sex] + f.perInch[sex] * inchesOver5ft;
}

export type IdealWeightResult = {
  /** Здоровый диапазон веса из ИМТ 18,5–24,9, кг */
  healthyLow: number;
  healthyHigh: number;
  /** Классические формулы: имя → кг */
  formulas: { id: string; name: string; year: number; kg: number }[];
  /** Среднее по классическим формулам, кг — «клинический ориентир» одной цифрой */
  clinicalAverage: number;
};

export function idealWeight(sex: Sex, heightCm: number): IdealWeightResult {
  const hM = heightCm / 100;
  const healthyLow = 18.5 * hM * hM;
  const healthyHigh = 24.9 * hM * hM;

  const formulas = IDEAL_FORMULAS.map((f) => ({
    id: f.id,
    name: f.name,
    year: f.year,
    kg: formulaWeight(f, sex, heightCm),
  }));
  const clinicalAverage = formulas.reduce((s, f) => s + f.kg, 0) / formulas.length;

  return { healthyLow, healthyHigh, formulas, clinicalAverage };
}
