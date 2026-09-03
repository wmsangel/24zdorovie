"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/config/site";
import { oneRepMax } from "@/lib/one-rep-max";

/**
 * Калькулятор одноповторного максимума (1RM).
 *
 * Ведёт от одной цифры к рабочему инструменту: крупно — оценка 1RM (среднее
 * по формулам), ниже — таблица рабочих весов под число повторений и честная
 * оговорка про диапазон точности и травмобезопасность.
 *
 * Формулы — в src/lib/one-rep-max.ts. Единица (кг/фунты) в расчёт не входит:
 * формулы отношенческие, поэтому вес просто проходит насквозь.
 */

const COPY = {
  ru: {
    weight: "Вес снаряда",
    reps: "Повторений в подходе",
    unitKg: "кг",
    unitLb: "фунты",
    resultTitle: "Ваш 1RM (оценка)",
    resultHint:
      "Это среднее по трём классическим формулам (Epley, Brzycki, Lombardi). Прямой замер 1RM новичкам не нужен и травмоопасен — субмаксимальная оценка безопаснее и почти так же точна.",
    formulasTitle: "По формулам",
    avg: "Среднее",
    targetsTitle: "Рабочие веса под число повторений",
    targetsHint:
      "От оценки 1RM по таблице долей NSCA. Удобно подбирать вес под цель подхода: сила — 3–5 повторов, гипертрофия — 8–12.",
    repsCol: "Повторов",
    pctCol: "% от 1RM",
    weightCol: "Вес",
    lowConf:
      "Выше 10 повторений формулы заметно расходятся: результат считайте очень грубым. Точнее всего оценка в диапазоне 2–10 повторов.",
    disclaimer:
      "Оценка, а не гарантия: реальный максимум зависит от техники, разминки, сна и опыта. Никогда не идите на настоящий 1RM без страхующего и без разминочных подходов.",
  },
  en: {
    weight: "Weight lifted",
    reps: "Reps in the set",
    unitKg: "kg",
    unitLb: "lb",
    resultTitle: "Your 1RM (estimate)",
    resultHint:
      "This is the average of three classic formulas (Epley, Brzycki, Lombardi). A true 1RM test is unnecessary for beginners and carries injury risk — a submaximal estimate is safer and nearly as accurate.",
    formulasTitle: "By formula",
    avg: "Average",
    targetsTitle: "Working weights by rep target",
    targetsHint:
      "From the 1RM estimate using the NSCA percentage table. Handy for picking a load for the goal of the set: strength — 3–5 reps, hypertrophy — 8–12.",
    repsCol: "Reps",
    pctCol: "% of 1RM",
    weightCol: "Weight",
    lowConf:
      "Above 10 reps the formulas diverge noticeably: treat the result as very rough. The estimate is most accurate in the 2–10 rep range.",
    disclaimer:
      "An estimate, not a guarantee: your real max depends on technique, warm-up, sleep and experience. Never attempt a true 1RM without a spotter and proper warm-up sets.",
  },
} as const;

const nf = (n: number, d = 1) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: d });

export function OneRepMaxCalculator({ locale = "ru" }: { locale?: Locale }) {
  const c = COPY[locale] ?? COPY.ru;

  const [unit, setUnit] = useState<"kg" | "lb">(locale === "en" ? "lb" : "kg");
  const [weight, setWeight] = useState(60);
  const [reps, setReps] = useState(5);

  const r = useMemo(() => oneRepMax(weight, reps), [weight, reps]);
  const u = unit === "kg" ? c.unitKg : c.unitLb;

  return (
    <section
      data-accent="ocean"
      className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
    >
      {/* Ввод */}
      <div className="grid gap-6 p-5 sm:grid-cols-[1fr_1fr_auto] md:p-7">
        <div>
          <label
            htmlFor="orm-weight"
            className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
          >
            {c.weight}, {u}
          </label>
          <input
            id="orm-weight"
            type="number"
            inputMode="decimal"
            min={1}
            max={org(unit)}
            value={weight}
            onChange={(e) => setWeight(Math.max(1, Math.min(org(unit), Number(e.target.value) || 0)))}
            className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-2xl font-semibold tabular-nums"
          />
        </div>
        <div>
          <label
            htmlFor="orm-reps"
            className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
          >
            {c.reps}
          </label>
          <input
            id="orm-reps"
            type="number"
            inputMode="numeric"
            min={1}
            max={20}
            value={reps}
            onChange={(e) => setReps(Math.max(1, Math.min(20, Number(e.target.value) || 0)))}
            className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-2xl font-semibold tabular-nums"
          />
        </div>
        <div className="self-end">
          <div className="flex overflow-hidden rounded-xl border border-[var(--line)]">
            {(["kg", "lb"] as const).map((x) => (
              <button
                key={x}
                type="button"
                onClick={() => setUnit(x)}
                aria-pressed={unit === x}
                className={`px-3.5 py-2.5 text-[0.9rem] font-semibold transition-colors ${
                  unit === x
                    ? "bg-[var(--brand-tint)] text-[var(--brand-strong)]"
                    : "text-[var(--ink-soft)] hover:bg-[var(--surface-2)]"
                }`}
              >
                {x === "kg" ? c.unitKg : c.unitLb}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Результат */}
      <div className="border-t border-[var(--line)] bg-[var(--accent-tint)] p-5 md:p-7">
        <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
          {c.resultTitle}
        </p>
        <p className="mt-2 font-display text-[2.6rem] font-semibold leading-none tabular-nums text-[var(--accent)]">
          {nf(r.average)} {u}
        </p>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
          {c.resultHint}
        </p>

        {r.lowConfidence && (
          <p className="mt-3 max-w-2xl rounded-xl bg-[var(--surface)] px-3.5 py-2.5 text-[0.88rem] leading-relaxed text-[var(--ink-soft)]">
            ⚠️ {c.lowConf}
          </p>
        )}

        {/* Формулы */}
        {r.formulas.length > 1 && (
          <div className="mt-7">
            <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
              {c.formulasTitle}
            </p>
            <div className="mt-3 overflow-hidden rounded-xl border border-[var(--line)]">
              {r.formulas.map((f, i) => (
                <div
                  key={f.id}
                  className={`grid grid-cols-[1fr_auto] items-center gap-2 px-3.5 py-2.5 text-[0.92rem] ${
                    i % 2 ? "bg-[var(--surface)]" : "bg-[var(--surface-2)]"
                  }`}
                >
                  <span className="text-[var(--ink-soft)]">{f.name}</span>
                  <span className="font-display font-semibold tabular-nums">
                    {nf(f.oneRm)} {u}
                  </span>
                </div>
              ))}
              <div className="grid grid-cols-[1fr_auto] items-center gap-2 border-t border-[var(--line)] bg-[var(--accent-tint)] px-3.5 py-2.5 text-[0.92rem]">
                <span className="font-semibold">{c.avg}</span>
                <span className="font-display font-semibold tabular-nums text-[var(--accent)]">
                  {nf(r.average)} {u}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Таблица рабочих весов */}
        <div className="mt-7">
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
            {c.targetsTitle}
          </p>
          <div className="mt-3 overflow-hidden rounded-xl border border-[var(--line)]">
            <div className="grid grid-cols-3 gap-2 bg-[var(--surface-2)] px-3.5 py-2 text-[0.72rem] font-bold uppercase tracking-[0.06em] text-[var(--ink-faint)]">
              <span>{c.repsCol}</span>
              <span className="text-center">{c.pctCol}</span>
              <span className="text-right">{c.weightCol}</span>
            </div>
            {r.targets.map((t, i) => (
              <div
                key={t.reps}
                className={`grid grid-cols-3 items-center gap-2 px-3.5 py-2 text-[0.92rem] tabular-nums ${
                  i % 2 ? "bg-[var(--surface)]" : "bg-[var(--surface-2)]"
                }`}
              >
                <span className="font-semibold">{t.reps}</span>
                <span className="text-center text-[var(--ink-soft)]">{t.percent}%</span>
                <span className="text-right font-display font-semibold">
                  {nf(t.weight)} {u}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 max-w-2xl text-[0.85rem] leading-relaxed text-[var(--ink-faint)]">
          {c.disclaimer}
        </p>
      </div>
    </section>
  );
}

/** Разумный верхний предел ввода веса под единицу */
function org(unit: "kg" | "lb"): number {
  return unit === "kg" ? 500 : 1100;
}
