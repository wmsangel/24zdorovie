/**
 * Прогноз менструаций по дате последней менструации и длине цикла.
 *
 * Отдельно от овуляции: там интент «фертильное окно», здесь — «когда начнутся
 * следующие месячные». Переиспользует примитив Day из menstrual-cycle.ts
 * (Day — номер дня, поэтому day + N = N дней спустя).
 *
 * Все функции проецируют введённую менструацию к «сегодня», поэтому корректно
 * работают, даже если пользователь ввёл дату несколько циклов назад.
 */
import { DEFAULT_CYCLE, type Day } from "./menstrual-cycle";

/** Начало текущего цикла: последняя менструация, спроецированная к сегодня. */
export function currentCycleStart(lmp: Day, today: Day, cycle: number = DEFAULT_CYCLE): Day {
  if (today <= lmp || cycle <= 0) return lmp;
  const passed = Math.floor((today - lmp) / cycle);
  return lmp + passed * cycle;
}

/** День текущего цикла: 1 = первый день менструации. */
export function cycleDay(lmp: Day, today: Day, cycle: number = DEFAULT_CYCLE): number {
  return today - currentCycleStart(lmp, today, cycle) + 1;
}

/** Дата начала следующей менструации (после сегодня). */
export function nextPeriod(lmp: Day, today: Day, cycle: number = DEFAULT_CYCLE): Day {
  return currentCycleStart(lmp, today, cycle) + cycle;
}

/** Дней до следующей менструации (0 = начинается сегодня). */
export function daysUntilNext(lmp: Day, today: Day, cycle: number = DEFAULT_CYCLE): number {
  return nextPeriod(lmp, today, cycle) - today;
}

export type PeriodWindow = { start: Day; end: Day };

/** Ближайшие N менструаций: окна [начало; конец] по длине менструации. */
export function upcomingPeriods(
  lmp: Day,
  today: Day,
  cycle: number,
  periodLength: number,
  count: number,
): PeriodWindow[] {
  const first = nextPeriod(lmp, today, cycle);
  const len = Math.max(1, periodLength);
  return Array.from({ length: count }, (_, i) => {
    const start = first + cycle * i;
    return { start, end: start + len - 1 };
  });
}
