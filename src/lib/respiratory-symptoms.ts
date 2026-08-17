/**
 * Модель сравнения симптомов простуды, гриппа и COVID-19.
 *
 * Это НЕ диагноз и не заменяет тест. Симптомы трёх заболеваний сильно
 * перекрываются, а грипп и COVID по одним симптомам вообще не различить —
 * поэтому инструмент показывает лишь, на какой паттерн больше похоже, и
 * всегда рядом с оговоркой. Отдельно вынесены «красные флаги» — симптомы,
 * при которых нужно обращаться за помощью независимо от вероятного диагноза.
 *
 * Веса — по типичной картине из материалов CDC и NHS, а не из клинической
 * шкалы: строгой валидированной балльной системы для такого различения нет.
 */

export type Condition = "cold" | "flu" | "covid";

export type PatternSymptom = {
  id: string;
  /** Вклад симптома в каждый паттерн, 0–3 */
  weights: Record<Condition, number>;
};

/**
 * Симптомы для сопоставления паттерна.
 * Насморк и чихание тянут к простуде; резкое начало, лихорадка и ломота —
 * к гриппу; потеря обоняния и одышка — к COVID.
 */
export const PATTERN_SYMPTOMS: PatternSymptom[] = [
  { id: "fever", weights: { cold: 0, flu: 3, covid: 2 } },
  { id: "suddenOnset", weights: { cold: 0, flu: 3, covid: 1 } },
  { id: "bodyAches", weights: { cold: 1, flu: 3, covid: 2 } },
  { id: "fatigue", weights: { cold: 1, flu: 3, covid: 2 } },
  { id: "dryCough", weights: { cold: 1, flu: 2, covid: 3 } },
  { id: "sneezing", weights: { cold: 3, flu: 0, covid: 1 } },
  { id: "runnyNose", weights: { cold: 3, flu: 1, covid: 1 } },
  { id: "soreThroat", weights: { cold: 2, flu: 1, covid: 2 } },
  { id: "headache", weights: { cold: 1, flu: 2, covid: 2 } },
  { id: "lossSmell", weights: { cold: 1, flu: 0, covid: 3 } },
];

/**
 * Красные флаги — повод обратиться за помощью независимо от паттерна.
 * Не участвуют в подсчёте вероятного диагноза.
 */
export const RED_FLAGS: string[] = [
  "troubleBreathing",
  "chestPain",
  "confusion",
  "blueLips",
  "persistentHighFever",
  "worseningAfterImprovement",
];

export type SymptomResult = {
  /** Баллы по каждому паттерну */
  scores: Record<Condition, number>;
  /** Доли 0..1 для визуализации */
  shares: Record<Condition, number>;
  /** Ведущий паттерн или null, если данных мало / близкий результат */
  leading: Condition | null;
  /** Сколько паттерн-симптомов отмечено */
  selectedCount: number;
  /** Разрыв между первым и вторым паттерном мал — различать нельзя */
  tooClose: boolean;
};

/**
 * Сопоставление отмеченных симптомов с паттернами.
 * leading выдаётся только при достаточном числе симптомов и заметном
 * отрыве лидера — иначе null, чтобы не создавать ложную уверенность.
 */
export function matchSymptoms(selectedPattern: string[]): SymptomResult {
  const scores: Record<Condition, number> = { cold: 0, flu: 0, covid: 0 };

  for (const s of PATTERN_SYMPTOMS) {
    if (selectedPattern.includes(s.id)) {
      scores.cold += s.weights.cold;
      scores.flu += s.weights.flu;
      scores.covid += s.weights.covid;
    }
  }

  const total = scores.cold + scores.flu + scores.covid;
  const shares: Record<Condition, number> = {
    cold: total ? scores.cold / total : 0,
    flu: total ? scores.flu / total : 0,
    covid: total ? scores.covid / total : 0,
  };

  const ranked = (Object.keys(scores) as Condition[]).sort((a, b) => scores[b] - scores[a]);
  const top = ranked[0];
  const second = ranked[1];
  const selectedCount = selectedPattern.length;

  // Отрыв лидера меньше 15% суммы — считаем неразличимым
  const tooClose = total === 0 || (scores[top] - scores[second]) / total < 0.15;
  const leading = selectedCount >= 3 && !tooClose ? top : null;

  return { scores, shares, leading, selectedCount, tooClose };
}
