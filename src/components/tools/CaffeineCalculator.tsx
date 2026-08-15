"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/config/site";

/**
 * Калькулятор кофеина: сколько его останется к отбою и до какого часа пить.
 *
 * Модель — однокамерная экспонента C(t) = dose × 2^(−t/T½). Для кофеина это
 * рабочее приближение: всасывание почти полное, пик через 30–60 минут,
 * дальше чистое выведение первого порядка (EFSA, 2015).
 *
 * Порог «сон не пострадает» = 30 мг. Число не выдумано: метаанализ Gardiner
 * и соавт. (Sleep Med Rev, 2023) даёт эмпирические отсечки 8,8 ч для 100 мг
 * и 13,2 ч для 217 мг. При T½ = 5 ч это ровно 29,5 мг и 34,8 мг остатка —
 * то есть один и тот же порог воспроизводит обе отсечки. Меняя его, вы
 * рассинхронизируете калькулятор с источником.
 */
const SLEEP_SAFE_MG = 30;

/** Период полувыведения, часы. Диапазон у здоровых взрослых 2–10 ч (Nehlig, 2018) */
const HALF_LIVES = {
  typical: 5,
  /** Курение индуцирует CYP1A2 и почти вдвое ускоряет клиренс */
  fast: 3.5,
  /** Комбинированные оральные контрацептивы примерно удваивают T½ */
  slow: 8,
  /** III триместр: описаны значения до 15 ч и выше */
  pregnancy: 12,
} as const;

type Metabolism = keyof typeof HALF_LIVES;

/** Ключ вердикта: расчёт не должен зависеть от локали, поэтому тип объявлен отдельно от COPY */
type Verdict = "clear" | "borderline" | "disruptive" | "severe";

const DRINKS = [
  { id: "espresso", mg: 63, emoji: "☕" },
  { id: "filter", mg: 95, emoji: "🫖" },
  { id: "double", mg: 200, emoji: "☕☕" },
  { id: "energy", mg: 80, emoji: "🥫" },
  { id: "tea", mg: 47, emoji: "🍵" },
  { id: "cola", mg: 34, emoji: "🥤" },
] as const;

const COPY = {
  ru: {
    dose: "Доза кофеина",
    mg: "мг",
    presets: "Или выберите напиток",
    drinks: {
      espresso: "Эспрессо",
      filter: "Чашка фильтр-кофе",
      double: "Двойной / большой стакан",
      energy: "Энергетик 250 мл",
      tea: "Чёрный чай",
      cola: "Кола 330 мл",
    },
    taken: "Время приёма",
    bed: "Время отбоя",
    metabolism: "Скорость метаболизма",
    metabolismOptions: {
      typical: "Обычная — 5 ч",
      fast: "Быстрая: курение — 3,5 ч",
      slow: "Медленная: гормональные контрацептивы — 8 ч",
      pregnancy: "Беременность — 12 ч",
    },
    resultTitle: "К моменту отбоя в организме останется",
    ofDose: "от выпитой дозы",
    afterHours: (h: string) => `через ${h} ч после приёма`,
    verdictTitle: "Что это значит",
    verdicts: {
      clear:
        "Ниже порога, при котором в исследованиях фиксируют ухудшение сна. Эта доза в это время сну не мешает.",
      borderline:
        "Пограничный остаток. Засыпание, скорее всего, не пострадает, но глубокий сон может стать короче — особенно если вы чувствительны к кофеину.",
      disruptive:
        "Достаточно, чтобы удлинить засыпание и урезать медленноволновой сон. Даже если вы уснёте быстро, структура сна изменится.",
      severe:
        "Фактически вы ложитесь спать с половиной чашки кофе в крови. Ожидайте долгое засыпание, пробуждения и разбитость утром.",
    },
    cutoffTitle: "Последний момент для этой дозы",
    cutoffText: (time: string, h: string) =>
      `Чтобы к отбою остаток упал ниже ${SLEEP_SAFE_MG} мг, эту дозу нужно выпить до ${time} — за ${h} ч до сна.`,
    cutoffNever: `Доза меньше ${SLEEP_SAFE_MG} мг — на сон она практически не влияет в любое время.`,
    cutoffPassed: "Вы уже позже этого времени.",
    cutoffOk: "Вы укладываетесь в это окно.",
    timelineTitle: "Как падает концентрация",
    now: "приём",
    bedShort: "отбой",
    halfTitle: "Полураспад",
    halfText: (t1: string, t2: string) =>
      `Половина дозы уйдёт к ${t1}, четверть останется к ${t2}.`,
    disclaimer:
      "Расчёт усреднённый. Реальная скорость выведения зависит от гена CYP1A2, лекарств и болезней печени и различается между людьми в разы.",
  },
  en: {
    dose: "Caffeine dose",
    mg: "mg",
    presets: "Or pick a drink",
    drinks: {
      espresso: "Espresso shot",
      filter: "Cup of filter coffee",
      double: "Double shot / large cup",
      energy: "Energy drink, 250 ml",
      tea: "Black tea",
      cola: "Cola, 330 ml",
    },
    taken: "Time you drink it",
    bed: "Bedtime",
    metabolism: "How fast you clear caffeine",
    metabolismOptions: {
      typical: "Typical — 5 h",
      fast: "Fast: smoker — 3.5 h",
      slow: "Slow: hormonal contraceptives — 8 h",
      pregnancy: "Pregnancy — 12 h",
    },
    resultTitle: "Still in your body at bedtime",
    ofDose: "of the dose you drank",
    afterHours: (h: string) => `${h} h after drinking it`,
    verdictTitle: "What this means",
    verdicts: {
      clear:
        "Below the level at which studies detect any measurable effect on sleep. At this time, this dose is fine.",
      borderline:
        "A borderline amount. Falling asleep will probably be unaffected, but deep sleep may be shortened — especially if you are caffeine-sensitive.",
      disruptive:
        "Enough to delay sleep onset and cut slow-wave sleep. Even if you fall asleep quickly, the architecture of your sleep changes.",
      severe:
        "You are effectively going to bed with half a coffee still in your bloodstream. Expect a long sleep onset, night wakings and a rough morning.",
    },
    cutoffTitle: "Your cut-off for this dose",
    cutoffText: (time: string, h: string) =>
      `To be under ${SLEEP_SAFE_MG} mg by bedtime, this dose needs to be finished by ${time} — ${h} h before sleep.`,
    cutoffNever: `Under ${SLEEP_SAFE_MG} mg in total — this dose has no meaningful effect on sleep at any hour.`,
    cutoffPassed: "You are already past that time.",
    cutoffOk: "You are inside that window.",
    timelineTitle: "How the level falls",
    now: "drink",
    bedShort: "bed",
    halfTitle: "Half-life",
    halfText: (t1: string, t2: string) =>
      `Half the dose is gone by ${t1}, and a quarter is still there at ${t2}.`,
    disclaimer:
      "These are averages. Real clearance depends on your CYP1A2 genotype, medication and liver health, and varies several-fold between people.",
  },
} as const;

/** "23:30" → 23.5 */
function parseTime(value: string): number {
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h + m / 60;
}

/** 23.5 → "23:30" */
function formatTime(hours: number): string {
  const wrapped = ((hours % 24) + 24) % 24;
  const h = Math.floor(wrapped);
  const m = Math.round((wrapped - h) * 60);
  // 13:60 округлилось бы в никуда — переносим в следующий час
  const [hh, mm] = m === 60 ? [(h + 1) % 24, 0] : [h, m];
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** Часы до отбоя; если отбой «раньше» приёма — значит, он уже за полночь */
function hoursUntil(from: number, to: number): number {
  const diff = to - from;
  return diff > 0 ? diff : diff + 24;
}

const nf = (n: number, digits = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: digits });

export function CaffeineCalculator({ locale = "ru" }: { locale?: Locale }) {
  const c = COPY[locale] ?? COPY.ru;

  const [dose, setDose] = useState(200);
  const [taken, setTaken] = useState("14:00");
  const [bed, setBed] = useState("23:00");
  const [metabolism, setMetabolism] = useState<Metabolism>("typical");

  const r = useMemo(() => {
    const halfLife = HALF_LIVES[metabolism];
    const takenAt = parseTime(taken);
    const bedAt = parseTime(bed);
    const hours = hoursUntil(takenAt, bedAt);

    const remaining = dose * Math.pow(0.5, hours / halfLife);
    const share = dose > 0 ? remaining / dose : 0;

    // Время, за которое доза падает до порога; при дозе ниже порога — не нужно
    const hoursToSafe = dose > SLEEP_SAFE_MG ? halfLife * Math.log2(dose / SLEEP_SAFE_MG) : null;
    const cutoffAt = hoursToSafe === null ? null : bedAt - hoursToSafe;

    const verdict: Verdict =
      remaining < SLEEP_SAFE_MG
        ? "clear"
        : remaining < 50
          ? "borderline"
          : remaining < 100
            ? "disruptive"
            : "severe";

    // Столбики по часу от приёма до отбоя; шаг растёт, если окно длинное
    const step = hours > 14 ? 2 : 1;
    const points: { hour: number; mg: number }[] = [];
    for (let h = 0; h <= hours; h += step) {
      points.push({ hour: takenAt + h, mg: dose * Math.pow(0.5, h / halfLife) });
    }
    if (points[points.length - 1].hour !== bedAt) points.push({ hour: bedAt, mg: remaining });

    return {
      halfLife,
      hours,
      remaining,
      share,
      hoursToSafe,
      cutoffAt,
      verdict,
      points,
      inWindow: hoursToSafe === null ? true : hours >= hoursToSafe,
      halfAt: takenAt + halfLife,
      quarterAt: takenAt + halfLife * 2,
    };
  }, [dose, taken, bed, metabolism]);

  const verdictAccent =
    r.verdict === "clear"
      ? "leaf"
      : r.verdict === "borderline"
        ? "amber"
        : r.verdict === "disruptive"
          ? "clay"
          : "berry";

  return (
    <section
      data-accent={verdictAccent}
      className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
    >
      {/* ── Ввод ─────────────────────────────────────────────── */}
      <div className="grid gap-6 p-5 md:p-7">
        <div>
          <label
            htmlFor="caffeine-dose"
            className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
          >
            {c.dose}
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              id="caffeine-dose"
              type="number"
              min={0}
              max={1000}
              step={5}
              value={dose}
              onChange={(e) => setDose(Math.max(0, Math.min(1000, Number(e.target.value) || 0)))}
              className="w-32 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-2xl font-semibold tabular-nums"
            />
            <span className="text-[var(--ink-soft)]">{c.mg}</span>
          </div>
          <input
            type="range"
            min={0}
            max={500}
            step={5}
            value={Math.min(dose, 500)}
            onChange={(e) => setDose(Number(e.target.value))}
            aria-label={c.dose}
            className="mt-4 w-full accent-[var(--brand)]"
          />
        </div>

        <div>
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
            {c.presets}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {DRINKS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDose(d.mg)}
                aria-pressed={dose === d.mg}
                className={`rounded-full border px-3.5 py-2 text-[0.84rem] font-semibold transition-colors ${
                  dose === d.mg
                    ? "border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--brand-strong)]"
                    : "border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--surface-2)]"
                }`}
              >
                <span aria-hidden="true">{d.emoji}</span> {c.drinks[d.id]}{" "}
                <span className="tabular-nums opacity-60">{d.mg}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="caffeine-taken"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.taken}
            </label>
            <input
              id="caffeine-taken"
              type="time"
              value={taken}
              onChange={(e) => setTaken(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 tabular-nums"
            />
          </div>
          <div>
            <label
              htmlFor="caffeine-bed"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.bed}
            </label>
            <input
              id="caffeine-bed"
              type="time"
              value={bed}
              onChange={(e) => setBed(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 tabular-nums"
            />
          </div>
          <div>
            <label
              htmlFor="caffeine-metabolism"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.metabolism}
            </label>
            <select
              id="caffeine-metabolism"
              value={metabolism}
              onChange={(e) => setMetabolism(e.target.value as Metabolism)}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5"
            >
              {(Object.keys(HALF_LIVES) as Metabolism[]).map((k) => (
                <option key={k} value={k}>
                  {c.metabolismOptions[k]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Результат ────────────────────────────────────────── */}
      <div className="border-t border-[var(--line)] bg-[var(--accent-tint)] p-5 md:p-7">
        <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
          {c.resultTitle}
        </p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-[2.75rem] font-semibold leading-none tabular-nums text-[var(--accent)]">
            {nf(r.remaining, r.remaining < 10 ? 1 : 0)} {c.mg}
          </span>
          <span className="text-[0.95rem] text-[var(--ink-soft)]">
            {nf(r.share * 100)}% {c.ofDose} · {c.afterHours(nf(r.hours, 1))}
          </span>
        </div>

        <p className="mt-4 text-[0.98rem] leading-relaxed">
          <span className="font-semibold">{c.verdictTitle}: </span>
          <span className="text-[var(--ink-soft)]">{c.verdicts[r.verdict]}</span>
        </p>

        {/* Кривая выведения */}
        <div className="mt-7">
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
            {c.timelineTitle}
          </p>
          <div className="mt-3 flex h-28 items-end gap-[3px]" aria-hidden="true">
            {r.points.map((p, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t-sm ${
                  i === r.points.length - 1 ? "bg-[var(--accent)]" : "bg-[var(--accent)]/35"
                }`}
                style={{ height: `${dose > 0 ? Math.max(2, (p.mg / dose) * 100) : 2}%` }}
                title={`${formatTime(p.hour)} — ${nf(p.mg)} ${c.mg}`}
              />
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[0.72rem] tabular-nums text-[var(--ink-faint)]">
            <span>
              {formatTime(parseTime(taken))} · {c.now}
            </span>
            <span>
              {formatTime(parseTime(bed))} · {c.bedShort}
            </span>
          </div>
          <p className="mt-3 text-[0.85rem] text-[var(--ink-soft)]">
            <span className="font-semibold">{c.halfTitle}. </span>
            {c.halfText(formatTime(r.halfAt), formatTime(r.quarterAt))}
          </p>
        </div>

        {/* Отсечка */}
        <div className="mt-6 rounded-xl border border-[color-mix(in_oklab,var(--accent)_30%,var(--line))] bg-[var(--surface)] p-4">
          <p className="font-semibold">⏰ {c.cutoffTitle}</p>
          <p className="mt-1.5 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
            {r.cutoffAt === null || r.hoursToSafe === null
              ? c.cutoffNever
              : `${c.cutoffText(formatTime(r.cutoffAt), nf(r.hoursToSafe, 1))} ${
                  r.inWindow ? c.cutoffOk : c.cutoffPassed
                }`}
          </p>
        </div>

        <p className="mt-5 text-[0.8rem] leading-relaxed text-[var(--ink-faint)]">{c.disclaimer}</p>
      </div>
    </section>
  );
}
