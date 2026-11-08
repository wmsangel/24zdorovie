"use client";

import { useState } from "react";
import type { Locale } from "@/config/site";

/**
 * Конвертер единиц витамина D: микрограммы (мкг) ↔ международные единицы (МЕ) ↔ мг.
 *
 * Единственный коэффициент: 1 мкг витамина D = 40 МЕ (NIH ODS). Миллиграммы
 * добавлены потому, что люди иногда ищут «25 ug в мг»: 1 мг = 1000 мкг.
 * Вводится одно число и его единица — две другие пересчитываются. Это
 * пересчёт единиц, а не рекомендация по дозе.
 */

const IU_PER_MCG = 40; // NIH ODS: 1 µg (mcg) vitamin D = 40 IU
const MCG_PER_MG = 1000;

type Unit = "mcg" | "iu" | "mg";

const COPY = {
  ru: {
    value: "Значение",
    unit: "Единица",
    units: { mcg: "мкг", iu: "МЕ", mg: "мг" } as Record<Unit, string>,
    unitsLong: {
      mcg: "микрограммы (мкг)",
      iu: "международные единицы (МЕ)",
      mg: "миллиграммы (мг)",
    } as Record<Unit, string>,
    result: "Результат",
    equals: "=",
    commonTitle: "Частые дозы",
    note: "Коэффициент один: 1 мкг = 40 МЕ. В миллиграммах дозы витамина D почти не указывают — 1000 МЕ это всего 0,025 мг.",
    disclaimer:
      "Это пересчёт единиц, а не рекомендация по дозе. Какая доза нужна именно вам — зависит от уровня 25(OH)D, веса и сезона; смотрите калькулятор дозы и обсуждайте с врачом.",
  },
  en: {
    value: "Value",
    unit: "Unit",
    units: { mcg: "mcg", iu: "IU", mg: "mg" } as Record<Unit, string>,
    unitsLong: {
      mcg: "micrograms (mcg)",
      iu: "international units (IU)",
      mg: "milligrams (mg)",
    } as Record<Unit, string>,
    result: "Result",
    equals: "=",
    commonTitle: "Common doses",
    note: "There is one factor: 1 mcg = 40 IU. Vitamin D doses are almost never written in milligrams — 1000 IU is only 0.025 mg.",
    disclaimer:
      "This is a unit conversion, not a dosing recommendation. The dose you actually need depends on your 25(OH)D level, body weight and season; see the dose calculator and discuss it with a doctor.",
  },
} as const;

/** Частые дозы: МЕ → мкг (из NIH ODS / типичных добавок) */
const COMMON: Array<{ iu: number; mcg: number; tag: { ru: string; en: string } }> = [
  { iu: 400, mcg: 10, tag: { ru: "младенцы", en: "infants" } },
  { iu: 600, mcg: 15, tag: { ru: "RDA взрослым", en: "adult RDA" } },
  { iu: 800, mcg: 20, tag: { ru: "RDA 70+", en: "RDA 70+" } },
  { iu: 1000, mcg: 25, tag: { ru: "частая добавка", en: "common supplement" } },
  { iu: 2000, mcg: 50, tag: { ru: "частая добавка", en: "common supplement" } },
  { iu: 4000, mcg: 100, tag: { ru: "верхний предел (UL)", en: "upper limit (UL)" } },
];

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "—";
  // до 3 знаков, без хвостовых нулей
  return Number(n.toFixed(3)).toLocaleString("en-US", { maximumFractionDigits: 3 });
}

export function VitaminDUnitConverter({ locale = "ru" }: { locale?: Locale }) {
  const c = COPY[locale] ?? COPY.ru;

  const [valueStr, setValueStr] = useState("25");
  const [unit, setUnit] = useState<Unit>("mcg");

  const n = parseFloat(valueStr.replace(",", "."));
  const has = Number.isFinite(n);

  // Приводим ввод к базе в мкг
  const mcg = !has ? NaN : unit === "mcg" ? n : unit === "iu" ? n / IU_PER_MCG : n * MCG_PER_MG;
  const iu = mcg * IU_PER_MCG;
  const mg = mcg / MCG_PER_MG;

  const order: Unit[] = ["mcg", "iu", "mg"];
  const vals: Record<Unit, number> = { mcg, iu, mg };

  return (
    <section
      data-accent="amber"
      className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
    >
      <div className="grid gap-6 p-5 md:p-7">
        <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label
              htmlFor="vdu-value"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.value}
            </label>
            <input
              id="vdu-value"
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              value={valueStr}
              onChange={(e) => setValueStr(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-2xl font-semibold tabular-nums"
            />
          </div>
          <div>
            <label
              htmlFor="vdu-unit"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.unit}
            </label>
            <select
              id="vdu-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value as Unit)}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-semibold"
            >
              {order.map((u) => (
                <option key={u} value={u}>
                  {c.unitsLong[u]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--line)] bg-[var(--accent-tint)] p-5 md:p-7">
        <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
          {c.result}
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {order.map((u) => (
            <div
              key={u}
              className={`rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 ${
                u === unit ? "opacity-70" : ""
              }`}
            >
              <p className="font-display text-xl font-semibold tabular-nums text-[var(--accent)]">
                {fmt(vals[u])}
              </p>
              <p className="text-[0.85rem] text-[var(--ink-soft)]">{c.unitsLong[u]}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[0.9rem] leading-relaxed text-[var(--ink-soft)]">{c.note}</p>

        <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
          <p className="font-semibold">💊 {c.commonTitle}</p>
          <div className="mt-2 grid gap-1.5 text-[0.92rem] tabular-nums">
            {COMMON.map((d) => (
              <div key={d.iu} className="flex justify-between gap-3">
                <span>
                  {d.iu.toLocaleString("en-US")} {c.units.iu} = {d.mcg} {c.units.mcg}
                </span>
                <span className="text-[var(--ink-faint)]">{d.tag[locale]}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-5 text-[0.8rem] leading-relaxed text-[var(--ink-faint)]">{c.disclaimer}</p>
      </div>
    </section>
  );
}
