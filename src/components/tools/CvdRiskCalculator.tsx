"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/config/site";
import {
  cvdRisk,
  CHOL_MGDL_TO_MMOL,
  type CvdCategory,
  type RiskRegion,
  type Sex,
} from "@/lib/cvd-risk";

/**
 * Калькулятор 10-летнего риска ССЗ по SCORE2 (2021).
 *
 * Регион калибровки по умолчанию зависит от локали: для RU это «очень
 * высокий» — именно так ESC классифицирует Россию и большинство стран СНГ.
 * Модель валидна для 40–69 лет без установленного ССЗ, диабета и ХБП;
 * за этими границами калькулятор честно отказывается считать.
 *
 * Формула — в src/lib/cvd-risk.ts.
 */

const COPY = {
  ru: {
    sex: "Пол",
    male: "Мужчина",
    female: "Женщина",
    age: "Возраст",
    years: "лет",
    ageHint: "Модель работает для 40–69 лет",
    smoker: "Курение",
    smokerYes: "Курю сейчас",
    smokerNo: "Не курю",
    sbp: "Систолическое АД",
    mmhg: "мм рт. ст.",
    totalChol: "Общий холестерин",
    hdl: "Холестерин ЛПВП",
    mmol: "ммоль/л",
    region: "Регион риска",
    regions: {
      low: "Низкий",
      moderate: "Умеренный",
      high: "Высокий",
      veryHigh: "Очень высокий — Россия, СНГ",
    } as Record<RiskRegion, string>,
    regionHint:
      "Классификация ESC по уровню смертности от ССЗ в стране. Россия, Украина, Беларусь и большинство стран СНГ отнесены к «очень высокому».",
    resultTitle: "10-летний риск инфаркта или инсульта",
    outOfRange:
      "SCORE2 рассчитана для 40–69 лет. Для 70+ используется отдельная модель SCORE2-OP, для младше 40 оценивают пожизненный риск, а не 10-летний.",
    categories: {
      lowMod: "Низкий–умеренный риск",
      high: "Высокий риск",
      veryHigh: "Очень высокий риск",
    } as Record<CvdCategory, string>,
    categoryNote: {
      lowMod:
        "Основа — образ жизни: не курить, движение, питание, нормальный вес. Медикаменты обычно не показаны, но факторы стоит держать под контролем.",
      high:
        "Показано активное снижение факторов риска и обсуждение с врачом целевых уровней холестерина и давления, иногда медикаментозной терапии.",
      veryHigh:
        "Нужна консультация врача: при таком риске обычно обсуждают снижение ЛПНП препаратами и контроль давления, не ограничиваясь образом жизни.",
    } as Record<CvdCategory, string>,
    unitToggle: "Ввести в мг/дл",
    mgdl: "мг/дл",
    disclaimer:
      "Это скрининговая оценка, а не диагноз. Модель не применяется при уже установленном сердечно-сосудистом заболевании, сахарном диабете, хронической болезни почек и семейной гиперхолестеринемии — там риск оценивают иначе и он заведомо высокий. Решения о лечении принимает врач.",
  },
  en: {
    sex: "Sex",
    male: "Male",
    female: "Female",
    age: "Age",
    years: "years",
    ageHint: "The model works for ages 40–69",
    smoker: "Smoking",
    smokerYes: "Current smoker",
    smokerNo: "Non-smoker",
    sbp: "Systolic blood pressure",
    mmhg: "mmHg",
    totalChol: "Total cholesterol",
    hdl: "HDL cholesterol",
    mmol: "mmol/L",
    region: "Risk region",
    regions: {
      low: "Low",
      moderate: "Moderate",
      high: "High",
      veryHigh: "Very high",
    } as Record<RiskRegion, string>,
    regionHint:
      "The ESC classification by national CVD mortality. Pick the region that matches your country; most of Western Europe is low or moderate.",
    resultTitle: "10-year risk of heart attack or stroke",
    outOfRange:
      "SCORE2 is built for ages 40–69. For 70+ the separate SCORE2-OP model applies; under 40, lifetime rather than 10-year risk is used.",
    categories: {
      lowMod: "Low to moderate risk",
      high: "High risk",
      veryHigh: "Very high risk",
    } as Record<CvdCategory, string>,
    categoryNote: {
      lowMod:
        "Lifestyle is the foundation: no smoking, movement, diet, a healthy weight. Medication is usually not indicated, but keep the factors in check.",
      high:
        "Active risk-factor reduction is warranted; discuss target cholesterol and blood-pressure levels — and sometimes medication — with a doctor.",
      veryHigh:
        "See a doctor: at this level, lowering LDL with medication and controlling blood pressure are usually discussed, not lifestyle alone.",
    } as Record<CvdCategory, string>,
    unitToggle: "Enter in mg/dL",
    mgdl: "mg/dL",
    disclaimer:
      "This is a screening estimate, not a diagnosis. The model does not apply to people with established cardiovascular disease, diabetes, chronic kidney disease or familial hypercholesterolaemia — their risk is assessed differently and is already high. Treatment decisions rest with a doctor.",
  },
} as const;

const CATEGORY_COLOR: Record<CvdCategory, string> = {
  lowMod: "#1fa268",
  high: "#d97706",
  veryHigh: "#dc2626",
};

const nf = (n: number, digits = 1) =>
  n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function CvdRiskCalculator({ locale = "ru" }: { locale?: Locale }) {
  const c = COPY[locale] ?? COPY.ru;

  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(55);
  const [smoker, setSmoker] = useState(false);
  const [sbp, setSbp] = useState(130);
  const [totalChol, setTotalChol] = useState(5.5);
  const [hdl, setHdl] = useState(1.3);
  const [region, setRegion] = useState<RiskRegion>(locale === "ru" ? "veryHigh" : "moderate");
  const [mgdl, setMgdl] = useState(false);

  // Внутри всегда ммоль/л; при вводе в мг/дл конвертируем на лету
  const cholMmol = mgdl ? totalChol / CHOL_MGDL_TO_MMOL : totalChol;
  const hdlMmol = mgdl ? hdl / CHOL_MGDL_TO_MMOL : hdl;

  const r = useMemo(
    () => cvdRisk({ sex, age, smoker, sbp, totalChol: cholMmol, hdl: hdlMmol, region }),
    [sex, age, smoker, sbp, cholMmol, hdlMmol, region]
  );

  return (
    <section
      data-accent="berry"
      className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
    >
      {/* ── Ввод ─────────────────────────────────────────────── */}
      <div className="grid gap-6 p-5 md:p-7">
        <div className="grid gap-4 sm:grid-cols-3">
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
                  className={`flex-1 rounded-xl border px-2.5 py-2.5 text-[0.88rem] font-semibold transition-colors ${
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
              htmlFor="cvd-age"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.age}, {c.years}
            </label>
            <input
              id="cvd-age"
              type="number"
              min={40}
              max={69}
              value={age}
              onChange={(e) => setAge(Math.max(18, Math.min(99, Number(e.target.value) || 0)))}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-xl font-semibold tabular-nums"
            />
          </div>
          <div>
            <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
              {c.smoker}
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setSmoker(false)}
                aria-pressed={!smoker}
                className={`flex-1 rounded-xl border px-2.5 py-2.5 text-[0.82rem] font-semibold transition-colors ${
                  !smoker
                    ? "border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--brand-strong)]"
                    : "border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--surface-2)]"
                }`}
              >
                {c.smokerNo}
              </button>
              <button
                type="button"
                onClick={() => setSmoker(true)}
                aria-pressed={smoker}
                className={`flex-1 rounded-xl border px-2.5 py-2.5 text-[0.82rem] font-semibold transition-colors ${
                  smoker
                    ? "border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--brand-strong)]"
                    : "border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--surface-2)]"
                }`}
              >
                {c.smokerYes}
              </button>
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="cvd-sbp"
            className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
          >
            {c.sbp}: {sbp} {c.mmhg}
          </label>
          <input
            id="cvd-sbp"
            type="range"
            min={100}
            max={200}
            step={1}
            value={sbp}
            onChange={(e) => setSbp(Number(e.target.value))}
            className="mt-3 w-full accent-[var(--brand)]"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="cvd-tc"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.totalChol}, {mgdl ? c.mgdl : c.mmol}
            </label>
            <input
              id="cvd-tc"
              type="number"
              min={0}
              step={mgdl ? 1 : 0.1}
              value={totalChol}
              onChange={(e) => setTotalChol(Math.max(0, Number(e.target.value) || 0))}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-lg font-semibold tabular-nums"
            />
          </div>
          <div>
            <label
              htmlFor="cvd-hdl"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.hdl}, {mgdl ? c.mgdl : c.mmol}
            </label>
            <input
              id="cvd-hdl"
              type="number"
              min={0}
              step={mgdl ? 1 : 0.1}
              value={hdl}
              onChange={(e) => setHdl(Math.max(0, Number(e.target.value) || 0))}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-lg font-semibold tabular-nums"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-[60%] grow">
            <label
              htmlFor="cvd-region"
              className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
            >
              {c.region}
            </label>
            <select
              id="cvd-region"
              value={region}
              onChange={(e) => setRegion(e.target.value as RiskRegion)}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5"
            >
              {(["low", "moderate", "high", "veryHigh"] as RiskRegion[]).map((k) => (
                <option key={k} value={k}>
                  {c.regions[k]}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setMgdl((v) => !v)}
            aria-pressed={mgdl}
            className="rounded-xl border border-[var(--line)] px-3.5 py-2.5 text-[0.82rem] font-semibold text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface-2)]"
          >
            {mgdl ? c.mmol : c.unitToggle}
          </button>
        </div>
        <p className="-mt-2 text-[0.82rem] leading-relaxed text-[var(--ink-faint)]">{c.regionHint}</p>
      </div>

      {/* ── Результат ────────────────────────────────────────── */}
      <div className="border-t border-[var(--line)] bg-[var(--accent-tint)] p-5 md:p-7">
        <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
          {c.resultTitle}
        </p>
        {r ? (
          <>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span
                className="font-display text-[2.75rem] font-semibold leading-none tabular-nums"
                style={{ color: CATEGORY_COLOR[r.category] }}
              >
                {nf(r.percent)}%
              </span>
              <span
                className="rounded-full px-3 py-1 text-[0.85rem] font-semibold text-white"
                style={{ backgroundColor: CATEGORY_COLOR[r.category] }}
              >
                {c.categories[r.category]}
              </span>
            </div>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
              {c.categoryNote[r.category]}
            </p>
          </>
        ) : (
          <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">{c.outOfRange}</p>
        )}

        <p className="mt-6 text-[0.8rem] leading-relaxed text-[var(--ink-faint)]">{c.disclaimer}</p>
      </div>
    </section>
  );
}
