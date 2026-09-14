"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { Locale } from "@/config/site";
import { plural } from "@/lib/i18n";
import {
  CYCLE_RANGE,
  DEFAULT_CYCLE,
  DEFAULT_PERIOD,
  dayParts,
  NORMAL_CYCLE,
  parseDay,
  PERIOD_RANGE,
  toIso,
  todayDay,
  weekday,
  type Day,
} from "@/lib/menstrual-cycle";
import { cycleDay, daysUntilNext, nextPeriod, upcomingPeriods } from "@/lib/period-calc";

/**
 * Календарь месячных: по дате последней менструации и длине цикла считает
 * дату следующих месячных, текущий день цикла и ближайшие циклы.
 * Логика — в src/lib/period-calc.ts.
 */

const MONTHS = {
  ru: {
    full: ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"],
    short: ["янв","фев","мар","апр","мая","июн","июл","авг","сен","окт","ноя","дек"],
  },
  en: {
    full: ["January","February","March","April","May","June","July","August","September","October","November","December"],
    short: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
  },
} as const;

const WEEKDAYS = {
  ru: ["пн", "вт", "ср", "чт", "пт", "сб", "вс"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
} as const;

function fmtLong(day: Day, locale: Locale, refYear?: number) {
  const { year, month, date } = dayParts(day);
  const base = `${date} ${MONTHS[locale].full[month - 1]}`;
  return year === refYear || refYear === undefined ? base : `${base} ${year}`;
}
function fmtShort(day: Day, locale: Locale) {
  const { month, date } = dayParts(day);
  return `${date} ${MONTHS[locale].short[month - 1]}`;
}
const fmtWeekday = (day: Day, locale: Locale) => WEEKDAYS[locale][weekday(day)];

const COPY = {
  ru: {
    lmp: "Первый день последних месячных",
    cycle: "Длина цикла",
    period: "Длится менструация",
    days: "дн.",
    nextTitle: "Следующие месячные",
    today: "начинаются сегодня",
    inDays: (n: number) => `через ${n} ${plural(n, ["день", "дня", "дней"])}`,
    cycleDay: (n: number) => `Сейчас ${n}-й день цикла`,
    upcoming: "Ближайшие циклы",
    normal: "Цикл в пределах нормы — 21–35 дней.",
    irregular: "Цикл вне диапазона 21–35 дней. Если так регулярно, это повод обсудить с врачом.",
    empty: "Укажите первый день последней менструации — рассчитаем остальное.",
    disclaimer:
      "Это прогноз по среднему циклу, а не гарантия: реальная дата плавает на несколько дней, а при нерегулярном цикле — сильнее. Календарный расчёт не является методом контрацепции и не заменяет наблюдение врача.",
  },
  en: {
    lmp: "First day of your last period",
    cycle: "Cycle length",
    period: "Period lasts",
    days: "days",
    nextTitle: "Next period",
    today: "starts today",
    inDays: (n: number) => `in ${n} ${n === 1 ? "day" : "days"}`,
    cycleDay: (n: number) => `Cycle day ${n}`,
    upcoming: "Upcoming periods",
    normal: "Cycle is within the normal range — 21–35 days.",
    irregular: "Cycle is outside 21–35 days. If that's typical for you, it's worth discussing with a doctor.",
    empty: "Enter the first day of your last period — the rest follows.",
    disclaimer:
      "This is a prediction from an average cycle, not a guarantee: the real date drifts by a few days, and more on an irregular cycle. Calendar tracking is not a contraceptive method and does not replace medical care.",
  },
} as const;

const subscribeNever = () => () => {};

export function PeriodCalculator({ locale = "ru" }: { locale?: Locale }) {
  const c = COPY[locale] ?? COPY.ru;
  const today = useSyncExternalStore(subscribeNever, todayDay, () => null);

  const [lmpInput, setLmpInput] = useState("");
  const [cycle, setCycle] = useState(DEFAULT_CYCLE);
  const [periodLen, setPeriodLen] = useState(DEFAULT_PERIOD);

  const lmp = lmpInput || (today === null ? "" : toIso(today));

  const result = useMemo(() => {
    if (today === null || !lmp) return null;
    const lmpDay = parseDay(lmp);
    return {
      next: nextPeriod(lmpDay, today, cycle),
      until: daysUntilNext(lmpDay, today, cycle),
      day: cycleDay(lmpDay, today, cycle),
      upcoming: upcomingPeriods(lmpDay, today, cycle, periodLen, 4),
      refYear: dayParts(today).year,
    };
  }, [today, lmp, cycle, periodLen]);

  const normal = cycle >= NORMAL_CYCLE.min && cycle <= NORMAL_CYCLE.max;
  const label = "block text-[0.74rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]";
  const field =
    "mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2.5 font-display text-lg font-semibold tabular-nums";

  return (
    <section
      data-accent="lavender"
      className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
    >
      {/* Ввод */}
      <div className="grid gap-6 p-5 sm:grid-cols-3 md:p-7">
        <div className="sm:col-span-3">
          <label htmlFor="pc-lmp" className={label}>{c.lmp}</label>
          <input
            id="pc-lmp"
            type="date"
            value={lmp}
            max={today === null ? undefined : toIso(today)}
            onChange={(e) => setLmpInput(e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="pc-cycle" className={label}>{c.cycle}, {c.days}</label>
          <input
            id="pc-cycle"
            type="number"
            inputMode="numeric"
            min={CYCLE_RANGE.min}
            max={CYCLE_RANGE.max}
            value={cycle}
            onChange={(e) =>
              setCycle(Math.max(CYCLE_RANGE.min, Math.min(CYCLE_RANGE.max, Number(e.target.value) || DEFAULT_CYCLE)))
            }
            className={field}
          />
        </div>
        <div>
          <label htmlFor="pc-period" className={label}>{c.period}, {c.days}</label>
          <input
            id="pc-period"
            type="number"
            inputMode="numeric"
            min={PERIOD_RANGE.min}
            max={PERIOD_RANGE.max}
            value={periodLen}
            onChange={(e) =>
              setPeriodLen(Math.max(PERIOD_RANGE.min, Math.min(PERIOD_RANGE.max, Number(e.target.value) || DEFAULT_PERIOD)))
            }
            className={field}
          />
        </div>
      </div>

      {/* Результат */}
      {result ? (
        <div className="border-t border-[var(--line)] bg-[var(--accent-tint)] p-5 md:p-7">
          <p className={label}>{c.nextTitle}</p>
          <p className="mt-2 font-display text-[2rem] font-semibold leading-none text-[var(--accent)] md:text-[2.4rem]">
            {fmtWeekday(result.next, locale)}, {fmtLong(result.next, locale, result.refYear)}
          </p>
          <p className="mt-2 text-[0.95rem] text-[var(--ink-soft)]">
            {result.until <= 0 ? c.today : c.inDays(result.until)} · {c.cycleDay(result.day)}
          </p>

          <div className="mt-6">
            <p className={label}>{c.upcoming}</p>
            <div className="mt-3 overflow-hidden rounded-xl border border-[var(--line)]">
              {result.upcoming.map((w, i) => (
                <div
                  key={w.start}
                  className={`grid grid-cols-[1fr_auto] items-center gap-2 px-3.5 py-2.5 text-[0.95rem] ${
                    i % 2 ? "bg-[var(--surface)]" : "bg-[var(--surface-2)]"
                  }`}
                >
                  <span className="text-[var(--ink-soft)]">{fmtWeekday(w.start, locale)}</span>
                  <span className="font-display font-semibold tabular-nums">
                    {fmtShort(w.start, locale)} — {fmtShort(w.end, locale)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className={`mt-4 text-[0.9rem] leading-relaxed ${normal ? "text-[var(--ink-faint)]" : "text-[var(--brand-strong)]"}`}>
            {normal ? c.normal : c.irregular}
          </p>
          <p className="mt-3 max-w-2xl text-[0.85rem] leading-relaxed text-[var(--ink-faint)]">
            {c.disclaimer}
          </p>
        </div>
      ) : (
        <div className="border-t border-[var(--line)] bg-[var(--surface-2)] p-5 text-[0.95rem] text-[var(--ink-soft)] md:p-7">
          {c.empty}
        </div>
      )}
    </section>
  );
}
