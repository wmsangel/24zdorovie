/**
 * Одноповторный максимум (1RM): оценка по подходу «вес × повторения».
 *
 * Прямой замер 1RM травмоопасен для новичков, поэтому его почти всегда
 * оценивают по субмаксимальному подходу. Формулы дают близкие, но не
 * одинаковые числа — поэтому показываем несколько и их среднее, а не одну
 * «точную» цифру. Все формулы наиболее точны в диапазоне до ~10 повторений;
 * дальше расхождение быстро растёт, о чём честно предупреждаем в интерфейсе.
 *
 * Формулы:
 *   Epley    : 1RM = w × (1 + reps/30)
 *   Brzycki  : 1RM = w × 36 / (37 − reps)
 *   Lombardi : 1RM = w × reps^0.10
 */

export type OneRmFormula = { id: string; name: string; oneRm: number };

/** Epley — единственная, где 1 повтор корректно даёт сам вес */
export function epley(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

/** Brzycki — точна на 2–10 повторов, расходится к 37 повторам (деление на 0) */
export function brzycki(weight: number, reps: number): number {
  return (weight * 36) / (37 - reps);
}

/** Lombardi — степенная, мягче на высоких повторениях */
export function lombardi(weight: number, reps: number): number {
  return weight * Math.pow(reps, 0.1);
}

/**
 * Доля 1RM для целевого числа повторений (по таблице NSCA/Baechle).
 * Обратная задача: «сколько вешать, чтобы сделать N повторов».
 */
export const REP_PERCENT: Record<number, number> = {
  1: 100,
  2: 95,
  3: 93,
  4: 90,
  5: 87,
  6: 85,
  8: 80,
  10: 75,
  12: 67,
  15: 65,
};

export type OneRmResult = {
  /** Оценки по трём формулам */
  formulas: OneRmFormula[];
  /** Среднее по формулам — рабочая оценка одной цифрой */
  average: number;
  /** Целевые веса под число повторений: reps → вес */
  targets: { reps: number; percent: number; weight: number }[];
  /** true, если ввод за пределами надёжного диапазона (>10 повторов) */
  lowConfidence: boolean;
};

export function oneRepMax(weight: number, reps: number): OneRmResult {
  const safeReps = Math.max(1, Math.min(reps, 36));

  const formulas: OneRmFormula[] =
    safeReps === 1
      ? [{ id: "actual", name: "Фактический подход", oneRm: weight }]
      : [
          { id: "epley", name: "Epley", oneRm: epley(weight, safeReps) },
          { id: "brzycki", name: "Brzycki", oneRm: brzycki(weight, safeReps) },
          { id: "lombardi", name: "Lombardi", oneRm: lombardi(weight, safeReps) },
        ];

  const average = formulas.reduce((s, f) => s + f.oneRm, 0) / formulas.length;

  const targets = Object.entries(REP_PERCENT).map(([r, percent]) => ({
    reps: Number(r),
    percent,
    weight: (average * percent) / 100,
  }));

  return { formulas, average, targets, lowConfidence: reps > 10 };
}
