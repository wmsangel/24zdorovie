"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/config/site";
import {
  CYCLE_RANGE,
  DEFAULT_CYCLE,
  dayParts,
  parseDay,
  todayDay,
  weekday,
  type Day,
} from "@/lib/menstrual-cycle";
import {
  atGestWeek,
  conceptionDay,
  dueDate,
  gestationalAge,
  MILESTONE_WEEKS,
  trimester,
} from "@/lib/due-date";

/**
 * Калькулятор даты родов и срока беременности по последней менструации
 * (правило Негеле). ПДР считается детерминированно, а срок «на сегодня»
 * появляется только после монтирования: todayDay() на сервере вернул бы
 * дату сборки, поэтому «сегодня» берём на клиенте, избегая рассинхрона
 * гидратации. Формулы — в src/lib/due-date.ts.
 */

const MONTHS: Record<Locale, string[]> = {
  ru: ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"],
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
};
const WEEKDAYS: Record<Locale, string[]> = {
  ru: ["понедельник","вторник","среда","четверг","пятница","суббота","воскресенье"],
  en: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
};

function fmtLong(day: Day, locale: Locale): string {
  const { month, date, year } = dayParts(day);
  return `${date} ${MONTHS[locale][month - 1]} ${year}`;
}
function fmtWeekday(day: Day, locale: Locale): string {
  return WEEKDAYS[locale][weekday(day)];
}

const COPY = {
  ru: {
    lmp: "Первый день последней менструации",
    cycle: "Длина цикла",
    days: "дней",
    pickHint: "Выберите дату последней менструации — рассчитаем дату родов и срок.",
    dueTitle: "Предполагаемая дата родов",
    gaTitle: "Срок беременности на сегодня",
    weeks: (w: number, d: number) =>
      `${w} ${plural(w, ["неделя", "недели", "недель"])} ${d} ${plural(d, ["день", "дня", "дней"])}`,
    trimesterLabel: (n: number) => `${n}-й триместр`,
    conception: "Оценка даты зачатия",
    milestonesTitle: "Ключевые сроки",
    milestones: {
      trimester2: "Начало 2 триместра (14 нед)",
      viability: "Порог жизнеспособности (24 нед)",
      fullTerm: "Доношенная беременность (37 нед)",
      due: "40 недель — ПДР",
      postTerm: "Переношенность (42 нед)",
    },
    futureNote: "Дата в будущем — проверьте ввод.",
    farNote: "Срок больше 44 недель — вероятно, дата введена неверно.",
    disclaimer:
      "Это оценка по правилу Негеле — от даты последней менструации при регулярном цикле. Точнее срок определяет УЗИ первого триместра. В ПДР рожают лишь около 4% — нормальным считается срок 37–42 недели. Расчёт не заменяет наблюдение врача.",
  },
  en: {
    lmp: "First day of last period",
    cycle: "Cycle length",
    days: "days",
    pickHint: "Pick the date of your last period — we'll estimate the due date and how far along you are.",
    dueTitle: "Estimated due date",
    gaTitle: "How far along today",
    weeks: (w: number, d: number) =>
      `${w} ${w === 1 ? "week" : "weeks"} ${d} ${d === 1 ? "day" : "days"}`,
    trimesterLabel: (n: number) => `Trimester ${n}`,
    conception: "Estimated conception date",
    milestonesTitle: "Key dates",
    milestones: {
      trimester2: "Second trimester begins (14 wk)",
      viability: "Viability threshold (24 wk)",
      fullTerm: "Full term (37 wk)",
      due: "40 weeks — due date",
      postTerm: "Post-term (42 wk)",
    },
    futureNote: "That date is in the future — check the input.",
    farNote: "Over 44 weeks along — the date is likely wrong.",
    disclaimer:
      "This is an estimate by Naegele's rule — from the last period with a regular cycle. A first-trimester ultrasound dates the pregnancy more precisely. Only about 4% give birth on the due date; 37–42 weeks is considered normal. It does not replace medical care.",
  },
} as const;

function plural(n: number, forms: [string, string, string]): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

export function DueDateCalculator({ locale = "ru" }: { locale?: Locale }) {
  const c = COPY[locale] ?? COPY.ru;

  const [lmpInput, setLmpInput] = useState("");
  const [cycle, setCycle] = useState(DEFAULT_CYCLE);
  // «Сегодня» только на клиенте — иначе SSR подставит дату сборки.
  const [today, setToday] = useState<Day | null>(null);
  useEffect(() => setToday(todayDay()), []);

  const lmp = useMemo(() => (lmpInput ? parseDay(lmpInput) : null), [lmpInput]);

  const r = useMemo(() => {
    if (lmp == null) return null;
    const due = dueDate(lmp, cycle);
    const conception = conceptionDay(lmp, cycle);
    const ga = today != null ? gestationalAge(lmp, today) : null;
    const tri = ga ? trimester(ga.weeks) : null;
    const milestones = [
      { id: "trimester2" as const, day: atGestWeek(lmp, MILESTONE_WEEKS.trimester2) },
      { id: "viability" as const, day: atGestWeek(lmp, MILESTONE_WEEKS.viability) },
      { id: "fullTerm" as const, day: atGestWeek(lmp, MILESTONE_WEEKS.fullTerm) },
      { id: "due" as const, day: due },
      { id: "postTerm" as const, day: atGestWeek(lmp, MILESTONE_WEEKS.postTerm) },
    ];
    return { due, conception, ga, tri, milestones };
  }, [lmp, cycle, today]);

  const progress = r?.ga ? Math.max(0, Math.min(100, (r.ga.weeks / 40) * 100)) : 0;
  const warn = r?.ga && r.ga.totalDays < 0 ? c.futureNote : r?.ga && r.ga.weeks > 44 ? c.farNote : null;

  return (
    <section
      data-accent="lavender"
      className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
    >
      {/* Ввод */}
      <div className="grid gap-4 p-5 sm:grid-cols-2 md:p-7">
        <div>
          <label
            htmlFor="dd-lmp"
            className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
          >
            {c.lmp}
          </label>
          <input
            id="dd-lmp"
            type="date"
            value={lmpInput}
            onChange={(e) => setLmpInput(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-lg font-semibold tabular-nums"
          />
        </div>
        <div>
          <label
            htmlFor="dd-cycle"
            className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
          >
            {c.cycle}: {cycle} {c.days}
          </label>
          <input
            id="dd-cycle"
            type="range"
            min={CYCLE_RANGE.min}
            max={CYCLE_RANGE.max}
            value={cycle}
            onChange={(e) => setCycle(Number(e.target.value))}
            className="mt-4 w-full accent-[var(--brand)]"
          />
        </div>
      </div>

      {/* Результат */}
      <div className="border-t border-[var(--line)] bg-[var(--accent-tint)] p-5 md:p-7">
        {!r ? (
          <p className="text-[0.98rem] leading-relaxed text-[var(--ink-soft)]">{c.pickHint}</p>
        ) : (
          <>
            <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
              {c.dueTitle}
            </p>
            <p className="mt-2 font-display text-[2rem] font-semibold leading-none text-[var(--accent)]">
              {fmtLong(r.due, locale)}
            </p>
            <p className="mt-1 text-[0.95rem] text-[var(--ink-soft)]">{fmtWeekday(r.due, locale)}</p>

            {r.ga && r.ga.totalDays >= 0 && r.ga.weeks <= 44 && (
              <div className="mt-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
                    {c.gaTitle}
                  </p>
                  {r.tri && (
                    <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-[0.82rem] font-semibold text-[var(--accent)]">
                      {c.trimesterLabel(r.tri)}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 font-display text-[1.5rem] font-semibold tabular-nums">
                  {c.weeks(r.ga.weeks, r.ga.days)}
                </p>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${progress}%` }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            )}

            {warn && (
              <p className="mt-4 rounded-xl border-l-[3px] border-[#b8790a] bg-[color-mix(in_oklab,#b8790a_10%,var(--surface))] p-3 text-[0.9rem]">
                {warn}
              </p>
            )}

            {/* Вехи */}
            <div className="mt-7">
              <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
                {c.milestonesTitle}
              </p>
              <div className="mt-3 overflow-hidden rounded-xl border border-[var(--line)]">
                {r.milestones.map((m, i) => (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between gap-3 px-3.5 py-2.5 text-[0.92rem] ${
                      m.id === "due" ? "font-semibold text-[var(--accent)]" : "text-[var(--ink-soft)]"
                    } ${i % 2 ? "bg-[var(--surface)]" : "bg-[var(--surface-2)]"}`}
                  >
                    <span>{c.milestones[m.id]}</span>
                    <span className="tabular-nums">{fmtLong(m.day, locale)}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-5 text-[0.9rem] leading-relaxed text-[var(--ink-soft)]">
              {c.conception}: <strong>{fmtLong(r.conception, locale)}</strong>
            </p>
            <p className="mt-4 text-[0.8rem] leading-relaxed text-[var(--ink-faint)]">{c.disclaimer}</p>
          </>
        )}
      </div>
    </section>
  );
}
