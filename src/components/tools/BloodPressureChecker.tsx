"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/config/site";
import { BP_CATEGORIES, classifyBp } from "@/lib/blood-pressure";

/**
 * Чекер артериального давления: относит пару САД/ДАД к категории ESC/ESH
 * и подсвечивает её в таблице. Не диагноз — об этом сказано прямо, плюс
 * отдельное предупреждение про криз и напоминание про повторные замеры.
 *
 * Классификация — в src/lib/blood-pressure.ts.
 */

const COPY = {
  ru: {
    sbp: "Верхнее (систолическое)",
    dbp: "Нижнее (диастолическое)",
    mmhg: "мм рт. ст.",
    yourCat: "Ваша категория",
    driverSbp: "Категорию задаёт верхнее число.",
    driverDbp: "Категорию задаёт нижнее число.",
    ish: "Похоже на изолированную систолическую гипертонию (верхнее высокое, нижнее в норме) — частый вариант с возрастом, обсудите с врачом.",
    crisis:
      "Очень высокое давление. Если есть боль в груди, одышка, сильная головная боль, нарушение зрения или речи — звоните в скорую. Иначе — срочно к врачу.",
    tableTitle: "Категории по ESC/ESH",
    head: ["Категория", "Верхнее", "", "Нижнее"],
    accaha:
      "В США действует другая сетка (ACC/AHA, 2017): гипертонией там считают уже от 130/80. Российские и европейские рекомендации (ESC/ESH) используют пороги выше — их и показывает этот инструмент.",
    repeat:
      "Одного измерения мало: давление колеблется. Для оценки нужны несколько замеров в разные дни, в покое, на обеих руках. Диагноз ставит только врач.",
    disclaimer:
      "Инструмент показывает, в какую категорию попадает введённая пара цифр, и не заменяет обследование. Измеряйте давление сидя, после 5 минут покоя, не сразу после кофе, курения и нагрузки.",
  },
  en: {
    sbp: "Systolic (upper)",
    dbp: "Diastolic (lower)",
    mmhg: "mmHg",
    yourCat: "Your category",
    driverSbp: "The upper number sets the category.",
    driverDbp: "The lower number sets the category.",
    ish: "This looks like isolated systolic hypertension (upper high, lower normal) — common with age; discuss it with a doctor.",
    crisis:
      "Very high pressure. With chest pain, breathlessness, severe headache, vision or speech problems — call emergency services. Otherwise, see a doctor urgently.",
    tableTitle: "Categories by ESC/ESH",
    head: ["Category", "Upper", "", "Lower"],
    accaha:
      "The US uses a different grid (ACC/AHA, 2017): hypertension there starts at 130/80. Russian and European guidance (ESC/ESH) use higher thresholds — the ones this tool shows.",
    repeat:
      "One reading is not enough: pressure fluctuates. Assessment needs several readings on different days, at rest, on both arms. Only a doctor makes a diagnosis.",
    disclaimer:
      "This tool shows which category a given pair of numbers falls into and does not replace a check-up. Measure seated, after 5 minutes of rest, not right after coffee, smoking or exercise.",
  },
} as const;

export function BloodPressureChecker({ locale = "ru" }: { locale?: Locale }) {
  const c = COPY[locale] ?? COPY.ru;

  const [sbp, setSbp] = useState(120);
  const [dbp, setDbp] = useState(80);

  const r = useMemo(() => classifyBp(sbp, dbp), [sbp, dbp]);

  return (
    <section
      data-accent="berry"
      className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
    >
      {/* Ввод */}
      <div className="grid gap-4 p-5 sm:grid-cols-2 md:p-7">
        <div>
          <label
            htmlFor="bp-sbp"
            className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
          >
            {c.sbp}, {c.mmhg}
          </label>
          <input
            id="bp-sbp"
            type="number"
            min={70}
            max={260}
            value={sbp}
            onChange={(e) => setSbp(Math.max(70, Math.min(260, Number(e.target.value) || 0)))}
            className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-2xl font-semibold tabular-nums"
          />
        </div>
        <div>
          <label
            htmlFor="bp-dbp"
            className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
          >
            {c.dbp}, {c.mmhg}
          </label>
          <input
            id="bp-dbp"
            type="number"
            min={40}
            max={160}
            value={dbp}
            onChange={(e) => setDbp(Math.max(40, Math.min(160, Number(e.target.value) || 0)))}
            className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-2xl font-semibold tabular-nums"
          />
        </div>
      </div>

      {/* Результат */}
      <div className="border-t border-[var(--line)] bg-[var(--accent-tint)] p-5 md:p-7">
        <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
          {c.yourCat}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span
            className="inline-block h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: r.category.color }}
            aria-hidden="true"
          />
          <span
            className="font-display text-[1.7rem] font-semibold leading-none"
            style={{ color: r.category.color }}
          >
            {r.category.name[locale]}
          </span>
          <span className="tabular-nums text-[var(--ink-soft)]">
            {sbp}/{dbp} {c.mmhg}
          </span>
        </div>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
          {r.category.blurb[locale]}
        </p>
        {r.driver !== "both" && (
          <p className="mt-1.5 text-[0.85rem] text-[var(--ink-faint)]">
            {r.driver === "sbp" ? c.driverSbp : c.driverDbp}
          </p>
        )}

        {r.crisis && (
          <div className="mt-4 rounded-xl border-l-[3px] border-[#b3402c] bg-[color-mix(in_oklab,#b3402c_10%,var(--surface))] p-4">
            <p className="text-[0.95rem] font-semibold leading-relaxed">⚠️ {c.crisis}</p>
          </div>
        )}
        {!r.crisis && r.isolatedSystolic && (
          <p className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-[0.9rem] leading-relaxed text-[var(--ink-soft)]">
            {c.ish}
          </p>
        )}

        {/* Таблица категорий */}
        <div className="mt-7">
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
            {c.tableTitle}
          </p>
          <div className="mt-3 overflow-hidden rounded-xl border border-[var(--line)]">
            {BP_CATEGORIES.map((cat, i) => (
              <div
                key={cat.id}
                className={`grid grid-cols-[1fr_auto] items-center gap-2 px-3.5 py-2.5 text-[0.9rem] ${
                  i === r.index ? "font-semibold" : "text-[var(--ink-soft)]"
                } ${i % 2 ? "bg-[var(--surface)]" : "bg-[var(--surface-2)]"}`}
                style={i === r.index ? { boxShadow: `inset 3px 0 0 ${cat.color}` } : undefined}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: cat.color }}
                    aria-hidden="true"
                  />
                  {cat.name[locale]}
                </span>
                <span className="tabular-nums text-[var(--ink-faint)]">
                  {cat.sbp} {cat.join[locale]} {cat.dbp}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
          <p className="font-semibold">🔁 {locale === "ru" ? "Один замер — не диагноз" : "One reading is not a diagnosis"}</p>
          <p className="mt-1.5 text-[0.93rem] leading-relaxed text-[var(--ink-soft)]">{c.repeat}</p>
        </div>

        <p className="mt-4 text-[0.85rem] leading-relaxed text-[var(--ink-faint)]">{c.accaha}</p>
        <p className="mt-3 text-[0.8rem] leading-relaxed text-[var(--ink-faint)]">{c.disclaimer}</p>
      </div>
    </section>
  );
}
