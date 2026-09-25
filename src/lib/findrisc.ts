/**
 * FINDRISC — Finnish Diabetes Risk Score.
 *
 * Валидированный опросник 10-летнего риска сахарного диабета 2 типа: 8 пунктов,
 * сумма 0–26 баллов, официальные пороги риска. В отличие от авторских тестов,
 * шкала и её границы взяты из публикации, а не выведены нами — поэтому баллы и
 * категории живут здесь, отдельно от разметки, и их можно проверить по источнику.
 *
 * Источник: Lindström J, Tuomilehto J. The Diabetes Risk Score: a practical tool
 * to predict type 2 diabetes risk. Diabetes Care. 2003;26(3):725–731.
 * 10-летние вероятности развития диабета — из той же работы (когорта, по которой
 * шкала калибровалась).
 *
 * Расчёт не зависит от локали: здесь только баллы за индекс выбранного варианта
 * и отображение категории; тексты вопросов/ответов — в компоненте.
 */

export type FindriscQuestion =
  | "age"
  | "bmi"
  | "waist"
  | "activity"
  | "diet"
  | "meds"
  | "highGlucose"
  | "family";

/**
 * Баллы за вариант ответа по его индексу (порядок вариантов фиксирован и должен
 * совпадать с порядком в COPY компонента). Пункт «waist» зависит от пола только
 * подписями (сантиметровые границы), баллы 0/3/4 одинаковы — пол в расчёт суммы
 * не входит.
 */
export const FINDRISC_POINTS: Record<FindriscQuestion, number[]> = {
  age: [0, 2, 3, 4], //  <45 · 45–54 · 55–64 · >64
  bmi: [0, 1, 3], //  <25 · 25–30 · >30
  waist: [0, 3, 4], //  низкая · средняя · высокая (границы зависят от пола)
  activity: [0, 2], //  ≥30 мин/день да · нет
  diet: [0, 1], //  овощи/фрукты каждый день · не каждый день
  meds: [0, 2], //  гипотензивные: нет · да
  highGlucose: [0, 5], //  когда-либо высокая глюкоза: нет · да
  family: [0, 3, 5], //  диабет у родни: нет · дальняя · близкая
};

export const FINDRISC_QUESTIONS = Object.keys(FINDRISC_POINTS) as FindriscQuestion[];

/** Теоретический максимум суммы (4+3+4+2+1+2+5+5) */
export const FINDRISC_MAX = FINDRISC_QUESTIONS.reduce(
  (sum, q) => sum + Math.max(...FINDRISC_POINTS[q]),
  0,
);

export type FindriscCategoryKey = "low" | "slightlyElevated" | "moderate" | "high" | "veryHigh";

/**
 * Категории риска и 10-летняя вероятность диабета 2 типа (по Lindström &
 * Tuomilehto, 2003). Границы включительны по нижней грани.
 */
export const FINDRISC_CATEGORIES: {
  key: FindriscCategoryKey;
  min: number;
  max: number;
  /** доля заболевших за 10 лет */
  risk: string;
  riskEn: string;
}[] = [
  { key: "low", min: 0, max: 6, risk: "≈ 1 из 100 (~1%)", riskEn: "≈ 1 in 100 (~1%)" },
  { key: "slightlyElevated", min: 7, max: 11, risk: "≈ 1 из 25 (~4%)", riskEn: "≈ 1 in 25 (~4%)" },
  { key: "moderate", min: 12, max: 14, risk: "≈ 1 из 6 (~17%)", riskEn: "≈ 1 in 6 (~17%)" },
  { key: "high", min: 15, max: 20, risk: "≈ 1 из 3 (~33%)", riskEn: "≈ 1 in 3 (~33%)" },
  { key: "veryHigh", min: 21, max: 26, risk: "≈ 1 из 2 (~50%)", riskEn: "≈ 1 in 2 (~50%)" },
];

/** Сумма баллов по ответам (индекс выбранного варианта на вопрос). */
export function scoreFindrisc(answers: Partial<Record<FindriscQuestion, number>>): number {
  return FINDRISC_QUESTIONS.reduce((sum, q) => {
    const idx = answers[q];
    if (idx == null) return sum;
    return sum + (FINDRISC_POINTS[q][idx] ?? 0);
  }, 0);
}

export function findriscCategory(total: number) {
  return (
    FINDRISC_CATEGORIES.find((c) => total >= c.min && total <= c.max) ??
    FINDRISC_CATEGORIES[FINDRISC_CATEGORIES.length - 1]
  );
}
