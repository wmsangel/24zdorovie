"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/config/site";
import {
  ANALYTES,
  estimatedAverageGlucose,
  getAnalyte,
  round,
  siToConv,
  convToSi,
} from "@/lib/blood-units";

/**
 * Конвертер единиц анализов крови: СИ ↔ традиционные (США).
 *
 * Два поля связаны в обе стороны — правка любого пересчитывает второе,
 * поэтому инструмент отвечает и на «ммоль/л → мг/дл», и на обратный запрос.
 * Рядом с результатом всегда стоит ориентир нормы в обеих единицах, но
 * без диагноза: пороги зависят от лаборатории, пола и риска.
 *
 * Коэффициенты и формулы — в src/lib/blood-units.ts.
 */

const COPY = {
  ru: {
    analyte: "Показатель",
    equals: "равно",
    refTitle: "Ориентир нормы",
    refRange: (lo: string, hi: string) => `${lo} – ${hi}`,
    refBelow: (v: string) => `ниже ${v}`,
    refAbove: (v: string) => `выше ${v}`,
    eagTitle: "Средняя глюкоза за ~3 месяца (eAG)",
    eagValue: (mgdl: string, mmol: string) => `${mmol} ммоль/л (${mgdl} мг/дл)`,
    eagNote: "Оценка по формуле ADAG — усреднённый сахар, которому соответствует ваш HbA1c.",
    refCaption:
      "Ориентир для взрослого, не диагноз: точные границы зависят от лаборатории, пола и возраста.",
    disclaimer:
      "Пересчёт единиц — арифметика и не заменяет интерпретацию врача. Нормы в разных лабораториях отличаются; сравнивайте результат с референсными значениями своего бланка.",
  },
  en: {
    analyte: "Marker",
    equals: "equals",
    refTitle: "Reference range",
    refRange: (lo: string, hi: string) => `${lo} – ${hi}`,
    refBelow: (v: string) => `below ${v}`,
    refAbove: (v: string) => `above ${v}`,
    eagTitle: "Estimated average glucose (~3 months)",
    eagValue: (mgdl: string, mmol: string) => `${mmol} mmol/L (${mgdl} mg/dL)`,
    eagNote: "From the ADAG equation — the average glucose your HbA1c corresponds to.",
    refCaption:
      "An adult reference, not a diagnosis: exact cut-offs vary by lab, sex and age.",
    disclaimer:
      "Unit conversion is arithmetic and does not replace a clinician's reading. Lab reference ranges differ; compare your result with the reference values printed on your own report.",
  },
} as const;

function fmt(n: number, decimals: number): string {
  if (!Number.isFinite(n)) return "—";
  return round(n, decimals).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function BloodUnitConverter({ locale = "ru" }: { locale?: Locale }) {
  const c = COPY[locale] ?? COPY.ru;

  const [id, setId] = useState(ANALYTES[0].id);
  const analyte = getAnalyte(id) ?? ANALYTES[0];

  // Источник истины — значение в СИ; храним строку ввода того поля, что правят.
  const [siStr, setSiStr] = useState(fmt(analyte.siDefault, analyte.siDecimals));
  const [convStr, setConvStr] = useState(
    fmt(siToConv(analyte, analyte.siDefault), analyte.convDecimals)
  );

  function selectAnalyte(nextId: string) {
    const a = getAnalyte(nextId);
    if (!a) return;
    setId(nextId);
    setSiStr(fmt(a.siDefault, a.siDecimals));
    setConvStr(fmt(siToConv(a, a.siDefault), a.convDecimals));
  }

  function onSi(value: string) {
    setSiStr(value);
    const n = parseFloat(value.replace(",", "."));
    setConvStr(Number.isFinite(n) ? fmt(siToConv(analyte, n), analyte.convDecimals) : "");
  }

  function onConv(value: string) {
    setConvStr(value);
    const n = parseFloat(value.replace(",", "."));
    setSiStr(Number.isFinite(n) ? fmt(convToSi(analyte, n), analyte.siDecimals) : "");
  }

  const siNum = parseFloat(siStr.replace(",", "."));

  const ref = useMemo(() => {
    if (!analyte.ref) return null;
    const { low, high } = analyte.ref;
    const si = (v: number) => `${fmt(v, analyte.siDecimals)} ${analyte.siUnit[locale]}`;
    const cv = (v: number) => `${fmt(siToConv(analyte, v), analyte.convDecimals)} ${analyte.convUnit[locale]}`;
    if (low != null && high != null) {
      return { siText: c.refRange(si(low), si(high)), convText: c.refRange(cv(low), cv(high)) };
    }
    if (high != null) return { siText: c.refBelow(si(high)), convText: c.refBelow(cv(high)) };
    if (low != null) return { siText: c.refAbove(si(low)), convText: c.refAbove(cv(low)) };
    return null;
  }, [analyte, locale, c]);

  const eag = useMemo(() => {
    if (analyte.id !== "hba1c" || !Number.isFinite(siNum)) return null;
    const percent = siToConv(analyte, siNum); // HbA1c в % (NGSP)
    const { mgdl, mmol } = estimatedAverageGlucose(percent);
    if (mgdl <= 0) return null;
    return { mgdl: fmt(mgdl, 0), mmol: fmt(mmol, 1) };
  }, [analyte, siNum]);

  return (
    <section
      data-accent="clay"
      className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
    >
      <div className="grid gap-6 p-5 md:p-7">
        {/* Выбор показателя */}
        <div>
          <label
            htmlFor="bu-analyte"
            className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
          >
            {c.analyte}
          </label>
          <select
            id="bu-analyte"
            value={id}
            onChange={(e) => selectAnalyte(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-semibold"
          >
            {ANALYTES.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name[locale]}
              </option>
            ))}
          </select>
        </div>

        {/* Связанные поля */}
        <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <div>
            <label
              htmlFor="bu-si"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {analyte.siUnit[locale]}
            </label>
            <input
              id="bu-si"
              type="number"
              inputMode="decimal"
              step={analyte.siStep}
              min={0}
              value={siStr}
              onChange={(e) => onSi(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-2xl font-semibold tabular-nums"
            />
          </div>

          <div
            aria-hidden="true"
            className="hidden pb-3 text-center text-2xl text-[var(--ink-faint)] sm:block"
          >
            ⇄
          </div>

          <div>
            <label
              htmlFor="bu-conv"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {analyte.convUnit[locale]}
            </label>
            <input
              id="bu-conv"
              type="number"
              inputMode="decimal"
              step={10 ** -analyte.convDecimals}
              min={0}
              value={convStr}
              onChange={(e) => onConv(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-2xl font-semibold tabular-nums"
            />
          </div>
        </div>
      </div>

      {/* Результат и контекст */}
      <div className="border-t border-[var(--line)] bg-[var(--accent-tint)] p-5 md:p-7">
        <p className="font-display text-[1.35rem] font-semibold leading-snug text-[var(--accent)]">
          {siStr || "—"} {analyte.siUnit[locale]} {c.equals} {convStr || "—"}{" "}
          {analyte.convUnit[locale]}
        </p>

        {ref && (
          <div className="mt-5 rounded-xl border border-[color-mix(in_oklab,var(--accent)_30%,var(--line))] bg-[var(--surface)] p-4">
            <p className="font-semibold">🎯 {c.refTitle}</p>
            <p className="mt-1.5 text-[0.98rem] tabular-nums">
              {ref.siText} · {ref.convText}
            </p>
            {analyte.note && (
              <p className="mt-2 text-[0.92rem] leading-relaxed text-[var(--ink-soft)]">
                {analyte.note[locale]}
              </p>
            )}
            <p className="mt-2 text-[0.8rem] leading-relaxed text-[var(--ink-faint)]">
              {c.refCaption}
            </p>
          </div>
        )}

        {eag && (
          <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="font-semibold">📈 {c.eagTitle}</p>
            <p className="mt-1.5 text-[0.98rem] font-semibold tabular-nums text-[var(--accent)]">
              {c.eagValue(eag.mgdl, eag.mmol)}
            </p>
            <p className="mt-2 text-[0.9rem] leading-relaxed text-[var(--ink-soft)]">{c.eagNote}</p>
          </div>
        )}

        <p className="mt-5 text-[0.8rem] leading-relaxed text-[var(--ink-faint)]">{c.disclaimer}</p>
      </div>
    </section>
  );
}
