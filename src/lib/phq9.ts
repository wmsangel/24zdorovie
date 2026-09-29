/**
 * PHQ-9 — Patient Health Questionnaire, шкала тяжести депрессии.
 *
 * Валидированный скрининговый опросник: 9 пунктов, каждый 0–3, сумма 0–27,
 * официальные пороги тяжести. Как и у FINDRISC, баллы и границы взяты из
 * публикации, а не выведены нами, поэтому живут отдельно от разметки.
 *
 * Источник: Kroenke K, Spitzer RL, Williams JBW. The PHQ-9: validity of a brief
 * depression severity measure. J Gen Intern Med. 2001;16(9):606–613.
 * Порог ≥10 — обычная точка отсечения для вероятной большой депрессии
 * (чувствительность и специфичность ~88%).
 *
 * ВАЖНО (безопасность): пункт 9 спрашивает о мыслях о смерти/самоповреждении.
 * Любой ненулевой ответ на него — сигнал тревоги независимо от суммы: интерфейс
 * обязан показать кризисную подсказку. Индекс пункта вынесен в SUICIDE_ITEM.
 */

export const PHQ9_ITEMS = 9;
/** Индекс пункта про мысли о причинении себе вреда (0-based: 9-й пункт) */
export const SUICIDE_ITEM = 8;

/** Варианты частоты, общие для всех пунктов: индекс = баллы 0–3 */
export const PHQ9_SCALE_POINTS = [0, 1, 2, 3] as const;

export const PHQ9_MAX = PHQ9_ITEMS * 3; // 27

export type Phq9SeverityKey = "minimal" | "mild" | "moderate" | "moderatelySevere" | "severe";

export const PHQ9_SEVERITY: { key: Phq9SeverityKey; min: number; max: number }[] = [
  { key: "minimal", min: 0, max: 4 },
  { key: "mild", min: 5, max: 9 },
  { key: "moderate", min: 10, max: 14 },
  { key: "moderatelySevere", min: 15, max: 19 },
  { key: "severe", min: 20, max: 27 },
];

/** Сумма баллов по ответам (индекс выбранного варианта = баллы) */
export function scorePhq9(answers: Partial<Record<number, number>>): number {
  let sum = 0;
  for (let i = 0; i < PHQ9_ITEMS; i++) sum += answers[i] ?? 0;
  return sum;
}

export function phq9Severity(total: number) {
  return (
    PHQ9_SEVERITY.find((s) => total >= s.min && total <= s.max) ??
    PHQ9_SEVERITY[PHQ9_SEVERITY.length - 1]
  );
}
