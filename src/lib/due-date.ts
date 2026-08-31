import { DEFAULT_CYCLE, type Day } from "./menstrual-cycle";

/**
 * Расчёт предполагаемой даты родов (ПДР) и срока беременности по дате
 * последней менструации — правило Негеле. Переиспользует примитивы дней из
 * menstrual-cycle.ts (Day — номер дня, поэтому day + N = N дней спустя).
 *
 * ПДР = первый день последней менструации + 280 дней, с поправкой на длину
 * цикла (при цикле ≠ 28 овуляция смещается, вместе с ней и дата родов).
 * Срок беременности по акушерской традиции считают от последней менструации.
 */

/** Дней от первого дня менструации до родов при 28-дневном цикле */
export const NAEGELE_DAYS = 280;

/** Предполагаемая дата родов (ПДР) */
export function dueDate(lmp: Day, cycleLength: number = DEFAULT_CYCLE): Day {
  return lmp + NAEGELE_DAYS + (cycleLength - 28);
}

/** Оценка даты зачатия: овуляция ≈ за 14 дней до следующей менструации */
export function conceptionDay(lmp: Day, cycleLength: number = DEFAULT_CYCLE): Day {
  return lmp + (cycleLength - 14);
}

/** День гестационной недели/дня: смещение от ПМ на N недель */
export function atGestWeek(lmp: Day, weeks: number): Day {
  return lmp + weeks * 7;
}

export type GestAge = { totalDays: number; weeks: number; days: number };

/** Срок беременности на сегодня: от последней менструации */
export function gestationalAge(lmp: Day, today: Day): GestAge {
  const totalDays = today - lmp;
  return { totalDays, weeks: Math.floor(totalDays / 7), days: ((totalDays % 7) + 7) % 7 };
}

export type Trimester = 1 | 2 | 3;

/** Триместр по сроку в неделях (1: до 14, 2: 14–27, 3: 28+) */
export function trimester(weeks: number): Trimester {
  if (weeks < 14) return 1;
  if (weeks < 28) return 2;
  return 3;
}

/**
 * Ключевые вехи беременности в гестационных неделях от ПМ.
 * viability — порог жизнеспособности, fullTerm — доношенность,
 * postTerm — переношенность.
 */
export const MILESTONE_WEEKS = {
  trimester2: 14,
  viability: 24,
  fullTerm: 37,
  due: 40,
  postTerm: 42,
} as const;
