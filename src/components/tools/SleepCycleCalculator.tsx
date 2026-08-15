"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/config/site";
import {
  ageBand,
  bedtimesForWake,
  CYCLE_MINUTES,
  CYCLE_RANGE,
  cycleWindow,
  DEFAULT_LATENCY,
  formatTime,
  NAP_OPTIONS,
  parseTime,
  SLEEP_NEED,
  sleepDebt,
  wakeTimesForBed,
  type CycleOption,
} from "@/lib/sleep-cycles";

/**
 * Калькулятор сна: во сколько ложиться или вставать.
 *
 * Инструмент популярный и обычно недобросовестный: сайты выдают время
 * с точностью до минуты, будто цикл сна у всех ровно 90 минут. Здесь
 * рядом с каждым вариантом показано окно, в которое он превращается
 * при реальном разбросе цикла 70–120 минут, — потому что именно этот
 * разброс и есть главная правда о «правиле 90 минут».
 *
 * Расчёты — в src/lib/sleep-cycles.ts.
 */

type Mode = "wake" | "bed";

const COPY = {
  ru: {
    modeTitle: "Что вы знаете",
    modes: {
      wake: "Во сколько вставать",
      bed: "Во сколько ложиться",
    },
    wakeLabel: "Подъём",
    bedLabel: "Отбой",
    age: "Возраст",
    years: "лет",
    latency: "Засыпаю примерно за",
    minutes: "мин",
    cycleLength: "Длительность цикла",
    cycleHint:
      "90 минут — среднее по популяции. Если вы знаете, что просыпаетесь легче при другом интервале, поставьте своё значение: разброс у здоровых взрослых 70–120 минут.",
    resultWake: "Ложитесь в одно из этих окон",
    resultBed: "Тогда вставать лучше в одно из этих окон",
    cycles: (n: number) => `${n} ${n === 1 ? "цикл" : n < 5 ? "цикла" : "циклов"}`,
    sleepTime: (h: string) => `${h} ч сна`,
    window: (from: string, to: string) => `при цикле 70–120 мин: ${from}–${to}`,
    recommended: "В норме для вашего возраста",
    short: "Короче нормы",
    withLatency: (n: string) => `плюс ${n} мин на засыпание`,
    needTitle: "Ваша норма сна",
    need: (min: string, max: string) => `${min}–${max} часов`,
    needHint:
      "Диапазон National Sleep Foundation. Это не цель, а коридор: попадание в него связано с лучшим самочувствием у большинства людей.",
    debtTitle: "Недосып за неделю",
    actual: "Сплю в среднем",
    hours: "ч",
    debtNone: "Недосыпа нет — вы попадаете в норму.",
    debt: (weekly: string, nightly: string) =>
      `Около ${weekly} ч за неделю, то есть ${nightly} ч за ночь. Долг накапливается: две недели по шесть часов ухудшают внимание примерно так же, как двое суток без сна, — при том что субъективно сонливость почти не растёт.`,
    debtSeverities: {
      none: "",
      mild: "Дефицит небольшой — обычно компенсируется одной-двумя ночами подряд.",
      significant:
        "Заметный дефицит. Отсыпаться в выходные помогает частично: восстанавливается бодрость, но не метаболические показатели.",
      severe:
        "Большой дефицит. На этом уровне страдают внимание, настроение и переносимость углеводов, а сам человек обычно считает, что «привык».",
    },
    napTitle: "Дневной сон",
    napOptions: {
      power: "20 минут — бодрость без инерции, не мешает ночному сну",
      avoid: "45 минут — худший вариант: подъём приходится на глубокую фазу",
      full: "90 минут — полный цикл, снова просыпаться легко",
    },
    napHint: "Спать днём после 15:00 не стоит: это съедает давление сна к вечеру.",
    disclaimer:
      "Циклы — усреднение. Их длительность меняется в течение ночи: под утро REM-фаза длиннее, и последние циклы растягиваются. Гораздо важнее точного времени отбоя его постоянство: один и тот же подъём семь дней в неделю делает для качества сна больше, чем любая арифметика по циклам.",
  },
  en: {
    modeTitle: "What you know",
    modes: {
      wake: "When I need to wake up",
      bed: "When I go to bed",
    },
    wakeLabel: "Wake-up",
    bedLabel: "Bedtime",
    age: "Age",
    years: "years",
    latency: "I fall asleep in about",
    minutes: "min",
    cycleLength: "Cycle length",
    cycleHint:
      "90 minutes is the population average. If you know you wake more easily on a different interval, set your own: the healthy adult range is 70–120 minutes.",
    resultWake: "Go to bed in one of these windows",
    resultBed: "Then aim to wake in one of these windows",
    cycles: (n: number) => `${n} ${n === 1 ? "cycle" : "cycles"}`,
    sleepTime: (h: string) => `${h} h of sleep`,
    window: (from: string, to: string) => `at 70–120 min cycles: ${from}–${to}`,
    recommended: "Within your age range",
    short: "Below your range",
    withLatency: (n: string) => `plus ${n} min to fall asleep`,
    needTitle: "Your sleep range",
    need: (min: string, max: string) => `${min}–${max} hours`,
    needHint:
      "The National Sleep Foundation range. Not a target but a corridor: landing inside it tracks with better wellbeing for most people.",
    debtTitle: "Weekly sleep debt",
    actual: "I average",
    hours: "h",
    debtNone: "No debt — you are inside your range.",
    debt: (weekly: string, nightly: string) =>
      `About ${weekly} h across the week, or ${nightly} h a night. Debt accumulates: two weeks at six hours degrade attention roughly as much as two nights without sleep — while subjective sleepiness barely rises.`,
    debtSeverities: {
      none: "",
      mild: "A small deficit — usually cleared by one or two full nights.",
      significant:
        "A meaningful deficit. Catching up at weekends works partially: alertness recovers, metabolic markers do not.",
      severe:
        "A large deficit. At this level attention, mood and glucose tolerance all suffer, and the person concerned usually believes they have simply adapted.",
    },
    napTitle: "Napping",
    napOptions: {
      power: "20 minutes — alertness without grogginess, does not touch your night",
      avoid: "45 minutes — the worst option: you wake out of deep sleep",
      full: "90 minutes — a full cycle, waking is easy again",
    },
    napHint: "Avoid napping after 3 p.m.: it eats into the sleep pressure you need by evening.",
    disclaimer:
      "Cycles are an average. Their length shifts across the night — REM lengthens towards morning, so the last cycles stretch. Consistency matters far more than precision: the same wake-up time seven days a week does more for sleep quality than any cycle arithmetic.",
  },
} as const;

const nf = (n: number, digits = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: digits });

export function SleepCycleCalculator({ locale = "ru" }: { locale?: Locale }) {
  const c = COPY[locale] ?? COPY.ru;

  const [mode, setMode] = useState<Mode>("wake");
  const [wake, setWake] = useState("07:00");
  const [bed, setBed] = useState("23:00");
  const [age, setAge] = useState(35);
  const [latency, setLatency] = useState(DEFAULT_LATENCY);
  const [cycleLength, setCycleLength] = useState(CYCLE_MINUTES);
  const [actualSleep, setActualSleep] = useState(6.5);

  const need = SLEEP_NEED[ageBand(age)];

  const options: CycleOption[] = useMemo(() => {
    const settings = { cycleLength, latency };
    return mode === "wake"
      ? bedtimesForWake(parseTime(wake), settings)
      : wakeTimesForBed(parseTime(bed), settings);
  }, [mode, wake, bed, cycleLength, latency]);

  const debt = useMemo(() => sleepDebt(actualSleep, age), [actualSleep, age]);

  const anchor = mode === "wake" ? parseTime(wake) : parseTime(bed);

  return (
    <section
      data-accent="lavender"
      className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
    >
      {/* ── Ввод ─────────────────────────────────────────────── */}
      <div className="grid gap-6 p-5 md:p-7">
        <div>
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
            {c.modeTitle}
          </p>
          <div className="mt-2 flex gap-2">
            {(["wake", "bed"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`flex-1 rounded-xl border px-3.5 py-2.5 text-[0.9rem] font-semibold transition-colors ${
                  mode === m
                    ? "border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--brand-strong)]"
                    : "border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--surface-2)]"
                }`}
              >
                {c.modes[m]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="sleep-time"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {mode === "wake" ? c.wakeLabel : c.bedLabel}
            </label>
            <input
              id="sleep-time"
              type="time"
              value={mode === "wake" ? wake : bed}
              onChange={(e) => (mode === "wake" ? setWake(e.target.value) : setBed(e.target.value))}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-xl font-semibold tabular-nums"
            />
          </div>
          <div>
            <label
              htmlFor="sleep-age"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.age}, {c.years}
            </label>
            <input
              id="sleep-age"
              type="number"
              min={14}
              max={100}
              value={age}
              onChange={(e) => setAge(Math.max(14, Math.min(100, Number(e.target.value) || 0)))}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 tabular-nums"
            />
          </div>
          <div>
            <label
              htmlFor="sleep-latency"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.latency}, {c.minutes}
            </label>
            <input
              id="sleep-latency"
              type="number"
              min={0}
              max={60}
              step={5}
              value={latency}
              onChange={(e) => setLatency(Math.max(0, Math.min(60, Number(e.target.value) || 0)))}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 tabular-nums"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="sleep-cycle"
            className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
          >
            {c.cycleLength}: {cycleLength} {c.minutes}
          </label>
          <input
            id="sleep-cycle"
            type="range"
            min={CYCLE_RANGE.min}
            max={CYCLE_RANGE.max}
            step={5}
            value={cycleLength}
            onChange={(e) => setCycleLength(Number(e.target.value))}
            className="mt-3 w-full accent-[var(--brand)]"
          />
          <p className="mt-2 text-[0.82rem] leading-relaxed text-[var(--ink-faint)]">
            {c.cycleHint}
          </p>
        </div>
      </div>

      {/* ── Результат ────────────────────────────────────────── */}
      <div className="border-t border-[var(--line)] bg-[var(--accent-tint)] p-5 md:p-7">
        <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
          {mode === "wake" ? c.resultWake : c.resultBed}
        </p>

        <div className="mt-3 grid gap-2.5">
          {options.map((o) => {
            const hours = o.sleepMinutes / 60;
            const enough = hours >= need.min;
            const w = cycleWindow(anchor, o.cycles, latency, mode === "bed");

            return (
              <div
                key={o.cycles}
                className={`grid gap-1.5 rounded-xl border p-4 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-5 ${
                  enough
                    ? "border-[color-mix(in_oklab,var(--accent)_35%,var(--line))] bg-[var(--surface)]"
                    : "border-[var(--line)] bg-[var(--surface)] opacity-75"
                }`}
              >
                <span className="font-display text-[2rem] font-semibold leading-none tabular-nums text-[var(--accent)]">
                  {formatTime(o.time)}
                </span>
                <div>
                  <p className="font-semibold">
                    {c.cycles(o.cycles)} · {c.sleepTime(nf(hours, 1))} ·{" "}
                    <span className={enough ? "text-[var(--brand-strong)]" : "text-[var(--ink-faint)]"}>
                      {enough ? c.recommended : c.short}
                    </span>
                  </p>
                  <p className="text-[0.83rem] text-[var(--ink-faint)]">
                    {c.withLatency(nf(latency))} · {c.window(formatTime(w.from), formatTime(w.to))}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Норма */}
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
              {c.needTitle}
            </p>
            <p className="mt-1.5 font-display text-[1.75rem] font-semibold leading-none tabular-nums">
              {c.need(nf(need.min), nf(need.max))}
            </p>
            <p className="mt-2 text-[0.83rem] leading-relaxed text-[var(--ink-soft)]">
              {c.needHint}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
              {c.debtTitle}
            </p>
            <div className="mt-2 flex items-center gap-2.5">
              <label htmlFor="sleep-actual" className="text-[0.85rem] text-[var(--ink-soft)]">
                {c.actual}
              </label>
              <input
                id="sleep-actual"
                type="number"
                min={3}
                max={12}
                step={0.5}
                value={actualSleep}
                onChange={(e) =>
                  setActualSleep(Math.max(3, Math.min(12, Number(e.target.value) || 0)))
                }
                className="w-20 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 tabular-nums"
              />
              <span className="text-[0.85rem] text-[var(--ink-soft)]">{c.hours}</span>
            </div>
            <p className="mt-2.5 text-[0.88rem] leading-relaxed text-[var(--ink-soft)]">
              {debt.severity === "none"
                ? c.debtNone
                : `${c.debt(nf(debt.weekly, 1), nf(debt.perNight, 1))} ${c.debtSeverities[debt.severity]}`}
            </p>
          </div>
        </div>

        {/* Дневной сон */}
        <div className="mt-6 rounded-xl border border-[color-mix(in_oklab,var(--accent)_30%,var(--line))] bg-[var(--surface)] p-4">
          <p className="font-semibold">😴 {c.napTitle}</p>
          <ul className="mt-2 grid gap-1.5 text-[0.92rem] leading-relaxed text-[var(--ink-soft)]">
            {NAP_OPTIONS.map((n) => (
              <li key={n.id}>{c.napOptions[n.id]}</li>
            ))}
          </ul>
          <p className="mt-2.5 text-[0.85rem] text-[var(--ink-faint)]">{c.napHint}</p>
        </div>

        <p className="mt-5 text-[0.8rem] leading-relaxed text-[var(--ink-faint)]">{c.disclaimer}</p>
      </div>
    </section>
  );
}
