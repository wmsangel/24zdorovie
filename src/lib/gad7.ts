/**
 * GAD-7 — Generalized Anxiety Disorder 7-item scale.
 *
 * Валидированный скрининг тревоги: 7 пунктов, каждый 0–3, сумма 0–21,
 * официальные пороги тяжести. Баллы и границы — из публикации, а не выведены
 * нами, поэтому живут отдельно от разметки.
 *
 * Источник: Spitzer RL, Kroenke K, Williams JBW, Löwe B. A brief measure for
 * assessing generalized anxiety disorder: the GAD-7. Arch Intern Med. 2006;166(10):1092–1097.
 * Порог ≥10 — обычная точка отсечения для вероятного генерализованного
 * тревожного расстройства (чувствительность 89%, специфичность 82%).
 */

export const GAD7_ITEMS = 7;

/** Варианты частоты, общие для всех пунктов: индекс = баллы 0–3 */
export const GAD7_SCALE_POINTS = [0, 1, 2, 3] as const;

export const GAD7_MAX = GAD7_ITEMS * 3; // 21

export type Gad7SeverityKey = "minimal" | "mild" | "moderate" | "severe";

export const GAD7_SEVERITY: { key: Gad7SeverityKey; min: number; max: number }[] = [
  { key: "minimal", min: 0, max: 4 },
  { key: "mild", min: 5, max: 9 },
  { key: "moderate", min: 10, max: 14 },
  { key: "severe", min: 15, max: 21 },
];

/** Сумма баллов по ответам (индекс выбранного варианта = баллы) */
export function scoreGad7(answers: Partial<Record<number, number>>): number {
  let sum = 0;
  for (let i = 0; i < GAD7_ITEMS; i++) sum += answers[i] ?? 0;
  return sum;
}

export function gad7Severity(total: number) {
  return (
    GAD7_SEVERITY.find((s) => total >= s.min && total <= s.max) ??
    GAD7_SEVERITY[GAD7_SEVERITY.length - 1]
  );
}
