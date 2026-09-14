/**
 * Рекомендуемая прибавка веса при беременности по нормам IOM/NAM 2009
 * (одноплодная беременность). Диапазон зависит от ИМТ до беременности:
 * чем выше исходный ИМТ, тем меньше рекомендуемая прибавка.
 *
 * ИМТ считаем тем же хелпером, что и остальные инструменты (body-composition).
 * Числа — из таблицы IOM 2009; это ориентир, а не цель: реальную прибавку
 * наблюдает врач, а при двойне нормы выше.
 */
import { bmi } from "./body-composition";

export type PrePregCat = "underweight" | "normal" | "overweight" | "obese";

/** total — общая прибавка (кг); rate — кг/нед во 2–3 триместрах. IOM 2009. */
export const IOM: Record<PrePregCat, { total: [number, number]; rate: [number, number] }> = {
  underweight: { total: [12.5, 18], rate: [0.44, 0.58] },
  normal: { total: [11.5, 16], rate: [0.35, 0.5] },
  overweight: { total: [7, 11.5], rate: [0.23, 0.33] },
  obese: { total: [5, 9], rate: [0.17, 0.27] },
};

/** Прибавка за первый триместр (кг), IOM: примерно 0,5–2 кг суммарно. */
export const FIRST_TRIMESTER: [number, number] = [0.5, 2];

export function prePregCategory(weightKg: number, heightCm: number): PrePregCat {
  const value = bmi(weightKg, heightCm);
  if (value < 18.5) return "underweight";
  if (value < 25) return "normal";
  if (value < 30) return "overweight";
  return "obese";
}

export type PregWeightResult = {
  bmi: number;
  category: PrePregCat;
  /** рекомендованная общая прибавка за беременность, кг */
  total: [number, number];
  /** темп во 2–3 триместрах, кг/нед */
  weeklyRate: [number, number];
  /** ожидаемая прибавка к сроку W (если задан), кг */
  expectedByWeek?: [number, number];
};

export function pregnancyWeightGain(
  weightKg: number,
  heightCm: number,
  week?: number,
): PregWeightResult {
  const value = bmi(weightKg, heightCm);
  const category = prePregCategory(weightKg, heightCm);
  const { total, rate } = IOM[category];

  let expectedByWeek: [number, number] | undefined;
  if (week && week >= 1) {
    const w = Math.min(week, 42);
    if (w <= 13) {
      const frac = w / 13;
      expectedByWeek = [FIRST_TRIMESTER[0] * frac, FIRST_TRIMESTER[1] * frac];
    } else {
      const after = w - 13;
      expectedByWeek = [
        FIRST_TRIMESTER[0] + rate[0] * after,
        FIRST_TRIMESTER[1] + rate[1] * after,
      ];
    }
  }

  return { bmi: value, category, total, weeklyRate: rate, expectedByWeek };
}
