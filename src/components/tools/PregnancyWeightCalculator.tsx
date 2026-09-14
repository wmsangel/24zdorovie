"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/config/site";
import { pregnancyWeightGain, type PrePregCat } from "@/lib/pregnancy-weight";

/**
 * Калькулятор прибавки веса при беременности по нормам IOM/NAM 2009.
 * Диапазон зависит от ИМТ до беременности; при указании срока показывает
 * ожидаемую прибавку «к этой неделе». Формулы — в src/lib/pregnancy-weight.ts.
 */

const COPY = {
  ru: {
    weight: "Вес до беременности",
    height: "Рост",
    week: "Срок, недель",
    weekOpt: "необязательно",
    kg: "кг",
    cm: "см",
    bmiLabel: "ИМТ до беременности",
    cats: {
      underweight: "дефицит массы",
      normal: "норма",
      overweight: "избыточная масса",
      obese: "ожирение",
    } as Record<PrePregCat, string>,
    totalTitle: "Рекомендуемая прибавка за беременность",
    rateTitle: "Темп во 2–3 триместре",
    perWeek: "кг/нед",
    expectedTitle: (w: number) => `Ожидаемая прибавка к ${w}-й неделе`,
    disclaimer:
      "Нормы IOM/NAM 2009 для одноплодной беременности. Это ориентир, а не цель, за которую нужно переживать: реальную прибавку и её темп оценивает врач, а при двойне и многоплодии нормы выше. Резкий скачок или, наоборот, отсутствие прибавки — повод обсудить со специалистом, а не подгонять цифру.",
  },
  en: {
    weight: "Pre-pregnancy weight",
    height: "Height",
    week: "Current week",
    weekOpt: "optional",
    kg: "kg",
    cm: "cm",
    bmiLabel: "Pre-pregnancy BMI",
    cats: {
      underweight: "underweight",
      normal: "normal",
      overweight: "overweight",
      obese: "obesity",
    } as Record<PrePregCat, string>,
    totalTitle: "Recommended total gain",
    rateTitle: "Rate in 2nd–3rd trimester",
    perWeek: "kg/wk",
    expectedTitle: (w: number) => `Expected gain by week ${w}`,
    disclaimer:
      "IOM/NAM 2009 ranges for a singleton pregnancy. This is a guide, not a target to stress over: your actual gain and its pace are followed by your doctor, and ranges are higher for twins or multiples. A sharp jump — or no gain at all — is a reason to talk to a professional, not to force the number.",
  },
} as const;

const nf = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });
const range = (r: [number, number], unit: string) => `${nf(r[0])}–${nf(r[1])} ${unit}`;

export function PregnancyWeightCalculator({ locale = "ru" }: { locale?: Locale }) {
  const c = COPY[locale] ?? COPY.ru;

  const [weight, setWeight] = useState(62);
  const [height, setHeight] = useState(165);
  const [week, setWeek] = useState<number | "">("");

  const r = useMemo(
    () => pregnancyWeightGain(weight, height, week === "" ? undefined : week),
    [weight, height, week],
  );
  const valid = weight > 0 && height > 0;

  const label = "block text-[0.74rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]";
  const field =
    "mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2.5 font-display text-xl font-semibold tabular-nums";

  return (
    <section
      data-accent="lavender"
      className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
    >
      {/* Ввод */}
      <div className="grid gap-6 p-5 sm:grid-cols-3 md:p-7">
        <div>
          <label htmlFor="pw-weight" className={label}>{c.weight}, {c.kg}</label>
          <input
            id="pw-weight"
            type="number"
            inputMode="decimal"
            min={35}
            max={200}
            value={weight}
            onChange={(e) => setWeight(Math.max(0, Number(e.target.value) || 0))}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="pw-height" className={label}>{c.height}, {c.cm}</label>
          <input
            id="pw-height"
            type="number"
            inputMode="numeric"
            min={130}
            max={210}
            value={height}
            onChange={(e) => setHeight(Math.max(0, Number(e.target.value) || 0))}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="pw-week" className={label}>
            {c.week} <span className="normal-case text-[var(--ink-faint)]">· {c.weekOpt}</span>
          </label>
          <input
            id="pw-week"
            type="number"
            inputMode="numeric"
            min={1}
            max={42}
            value={week}
            placeholder="—"
            onChange={(e) => {
              const v = e.target.value;
              setWeek(v === "" ? "" : Math.max(1, Math.min(42, Number(v) || 1)));
            }}
            className={field}
          />
        </div>
      </div>

      {/* Результат */}
      <div className="border-t border-[var(--line)] bg-[var(--accent-tint)] p-5 md:p-7">
        <p className="text-[0.9rem] text-[var(--ink-soft)]">
          {c.bmiLabel}:{" "}
          <span className="font-semibold text-[var(--ink)]">{valid ? nf(r.bmi) : "—"}</span>
          {valid && <> · {c.cats[r.category]}</>}
        </p>

        <p className={`${label} mt-5`}>{c.totalTitle}</p>
        <p className="mt-2 font-display text-[2.4rem] font-semibold leading-none tabular-nums text-[var(--accent)]">
          {valid ? range(r.total, c.kg) : "—"}
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
            <p className={label}>{c.rateTitle}</p>
            <p className="mt-1 font-display text-[1.3rem] font-semibold tabular-nums">
              {valid ? range(r.weeklyRate, c.perWeek) : "—"}
            </p>
          </div>
          {r.expectedByWeek && (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
              <p className={label}>{c.expectedTitle(typeof week === "number" ? week : 0)}</p>
              <p className="mt-1 font-display text-[1.3rem] font-semibold tabular-nums">
                {range(r.expectedByWeek, c.kg)}
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 max-w-2xl text-[0.85rem] leading-relaxed text-[var(--ink-faint)]">
          {c.disclaimer}
        </p>
      </div>
    </section>
  );
}
