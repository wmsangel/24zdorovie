"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/config/site";
import { idealWeight, type Sex } from "@/lib/ideal-weight";

/**
 * Калькулятор идеального веса. Сознательно ведёт от «одной цифры» к диапазону:
 * крупно — здоровый диапазон по ИМТ, ниже — классические формулы как
 * исторический ориентир, с оговоркой про мышцы и телосложение.
 *
 * Формулы — в src/lib/ideal-weight.ts.
 */

const COPY = {
  ru: {
    sex: "Пол",
    male: "Мужчина",
    female: "Женщина",
    height: "Рост",
    cm: "см",
    kg: "кг",
    rangeTitle: "Здоровый диапазон веса",
    rangeHint:
      "Это ориентир по ИМТ (18,5–24,9). Единой «идеальной» цифры не существует: здоровым считается диапазон, а не одно число. У людей с большой мышечной массой верхняя граница может быть выше без вреда.",
    clinicalTitle: "Классические формулы «идеального веса»",
    clinicalHint:
      "Формулы Devine, Robinson, Miller и Hamwi созданы в 1960–80-х годах, в основном для расчёта доз лекарств. Они дают одну точку, зависят только от роста и пола и не учитывают телосложение и долю мышц. Показываем их прозрачно — как исторический ориентир, а не как цель.",
    avg: "Среднее по формулам",
    formula: "Формула",
    disclaimer:
      "Вес — лишь один и довольно грубый показатель здоровья. Окружность талии, доля мышц, давление и анализы говорят больше, чем цифра на весах. При росте ниже 152 см классические формулы неточны. Это не медицинская рекомендация.",
  },
  en: {
    sex: "Sex",
    male: "Male",
    female: "Female",
    height: "Height",
    cm: "cm",
    kg: "kg",
    rangeTitle: "Healthy weight range",
    rangeHint:
      "This is the BMI-based range (18.5–24.9). There is no single 'ideal' number: a range is healthy, not one figure. People with high muscle mass can sit above the upper bound without harm.",
    clinicalTitle: "Classic 'ideal weight' formulas",
    clinicalHint:
      "The Devine, Robinson, Miller and Hamwi formulas were created in the 1960s–80s, mainly for drug dosing. They give a single point, depend only on height and sex, and ignore build and muscle. We show them transparently — as a historical reference, not a target.",
    avg: "Average of the formulas",
    formula: "Formula",
    disclaimer:
      "Weight is only one, fairly crude, health marker. Waist circumference, muscle mass, blood pressure and lab results say more than the number on the scale. Below 152 cm the classic formulas are imprecise. This is not medical advice.",
  },
} as const;

const nf = (n: number, d = 1) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

export function IdealWeightCalculator({ locale = "ru" }: { locale?: Locale }) {
  const c = COPY[locale] ?? COPY.ru;

  const [sex, setSex] = useState<Sex>("male");
  const [height, setHeight] = useState(175);

  const r = useMemo(() => idealWeight(sex, height), [sex, height]);

  return (
    <section
      data-accent="clay"
      className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
    >
      {/* Ввод */}
      <div className="grid gap-6 p-5 sm:grid-cols-2 md:p-7">
        <div>
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
            {c.sex}
          </p>
          <div className="mt-2 flex gap-2">
            {(["male", "female"] as Sex[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSex(s)}
                aria-pressed={sex === s}
                className={`flex-1 rounded-xl border px-2.5 py-2.5 text-[0.9rem] font-semibold transition-colors ${
                  sex === s
                    ? "border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--brand-strong)]"
                    : "border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--surface-2)]"
                }`}
              >
                {s === "male" ? c.male : c.female}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label
            htmlFor="iw-height"
            className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
          >
            {c.height}, {c.cm}
          </label>
          <input
            id="iw-height"
            type="number"
            inputMode="numeric"
            min={130}
            max={220}
            value={height}
            onChange={(e) => setHeight(Math.max(130, Math.min(220, Number(e.target.value) || 0)))}
            className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-2xl font-semibold tabular-nums"
          />
        </div>
      </div>

      {/* Результат: здоровый диапазон */}
      <div className="border-t border-[var(--line)] bg-[var(--accent-tint)] p-5 md:p-7">
        <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
          {c.rangeTitle}
        </p>
        <p className="mt-2 font-display text-[2.4rem] font-semibold leading-none tabular-nums text-[var(--accent)]">
          {nf(r.healthyLow)}–{nf(r.healthyHigh)} {c.kg}
        </p>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
          {c.rangeHint}
        </p>

        {/* Классические формулы */}
        <div className="mt-7">
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
            {c.clinicalTitle}
          </p>
          <div className="mt-3 overflow-hidden rounded-xl border border-[var(--line)]">
            {r.formulas.map((f, i) => (
              <div
                key={f.id}
                className={`grid grid-cols-[1fr_auto] items-center gap-2 px-3.5 py-2.5 text-[0.92rem] ${
                  i % 2 ? "bg-[var(--surface)]" : "bg-[var(--surface-2)]"
                }`}
              >
                <span className="text-[var(--ink-soft)]">
                  {f.name}{" "}
                  <span className="text-[0.8rem] text-[var(--ink-faint)] tabular-nums">
                    {f.year}
                  </span>
                </span>
                <span className="font-display font-semibold tabular-nums">
                  {nf(f.kg)} {c.kg}
                </span>
              </div>
            ))}
            <div className="grid grid-cols-[1fr_auto] items-center gap-2 border-t border-[var(--line)] bg-[var(--accent-tint)] px-3.5 py-2.5 text-[0.92rem]">
              <span className="font-semibold">{c.avg}</span>
              <span className="font-display font-semibold tabular-nums text-[var(--accent)]">
                {nf(r.clinicalAverage)} {c.kg}
              </span>
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-[0.9rem] leading-relaxed text-[var(--ink-faint)]">
            {c.clinicalHint}
          </p>
        </div>

        <p className="mt-6 max-w-2xl text-[0.85rem] leading-relaxed text-[var(--ink-faint)]">
          {c.disclaimer}
        </p>
      </div>
    </section>
  );
}
