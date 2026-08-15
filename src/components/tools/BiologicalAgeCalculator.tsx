"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/config/site";
import {
  CONVERT,
  LIFESTYLE_FACTORS,
  lifestyleOffset,
  phenoAge,
  type LifestyleAnswers,
  type PhenoAgeInput,
} from "@/lib/biological-age";

/**
 * Калькулятор биологического возраста в двух режимах.
 *
 * Режим «кровь» считает PhenoAge — опубликованную формулу, валидированную
 * по смертности. Режим «образ жизни» считает сумму поправок к ожидаемой
 * продолжительности жизни и биологическим возрастом не является; это
 * проговаривается в интерфейсе, а не мелким шрифтом внизу.
 */

/** Ориентир «хорошей» панели: относительно него считается вклад каждого маркера */
const REFERENCE: Omit<PhenoAgeInput, "age"> = {
  albumin: 45,
  creatinine: 80,
  glucose: 5,
  crp: 0.05,
  lymphocytes: 32,
  mcv: 90,
  rdw: 13,
  alp: 70,
  wbc: 6,
};

type MarkerId = keyof typeof REFERENCE;

/** Ключ трактовки: расчёт не должен зависеть от локали, поэтому тип объявлен отдельно от COPY */
type Band = "muchYounger" | "younger" | "same" | "older" | "muchOlder";

/** Поля с двумя системами единиц: СИ по умолчанию, традиционные — переключателем */
const UNIT_FIELDS = {
  albumin: { si: "г/л", alt: "г/дл", siEn: "g/L", altEn: "g/dL", convert: CONVERT.albuminFromGdl },
  creatinine: {
    si: "мкмоль/л",
    alt: "мг/дл",
    siEn: "µmol/L",
    altEn: "mg/dL",
    convert: CONVERT.creatinineFromMgdl,
  },
  glucose: {
    si: "ммоль/л",
    alt: "мг/дл",
    siEn: "mmol/L",
    altEn: "mg/dL",
    convert: CONVERT.glucoseFromMgdl,
  },
  crp: { si: "мг/л", alt: "мг/дл", siEn: "mg/L", altEn: "mg/dL", convert: (v: number) => v },
} as const;

type UnitField = keyof typeof UNIT_FIELDS;

const COPY = {
  ru: {
    tabBlood: "По анализам крови",
    tabLifestyle: "По образу жизни",
    tabBloodHint: "PhenoAge — формула Levine, валидирована по смертности",
    tabLifestyleHint: "Оценка без анализов. Это не биологический возраст",
    age: "Ваш возраст",
    years: "лет",
    markers: {
      albumin: "Альбумин",
      creatinine: "Креатинин",
      glucose: "Глюкоза натощак",
      crp: "СРБ (высокочувствительный)",
      lymphocytes: "Лимфоциты",
      mcv: "MCV — средний объём эритроцита",
      rdw: "RDW — ширина распределения эритроцитов",
      alp: "Щелочная фосфатаза",
      wbc: "Лейкоциты",
    },
    units: { lymphocytes: "%", mcv: "фл", rdw: "%", alp: "Ед/л", wbc: "×10⁹/л" },
    resultTitle: "Ваш PhenoAge",
    chronological: "Хронологический возраст",
    deltaYounger: (y: string) => `на ${y} года(лет) моложе паспортного`,
    deltaOlder: (y: string) => `на ${y} года(лет) старше паспортного`,
    deltaSame: "совпадает с паспортным",
    bands: {
      muchYounger:
        "Показатели заметно лучше среднего для вашего возраста. Это хороший результат, но помните: PhenoAge — суррогатная метрика, а не гарантия.",
      younger: "Показатели лучше среднего для вашего возраста.",
      same: "Вы стареете примерно со средней для популяции скоростью. Это норма, а не приговор и не повод для действий.",
      older:
        "Показатели хуже среднего для вашего возраста. Стоит посмотреть, какие именно маркеры вносят вклад — список ниже.",
      muchOlder:
        "Разрыв большой, и обычно за ним стоит один-два конкретных отклонившихся показателя, а не «старение» вообще. Покажите панель врачу: это разговор про диагноз, а не про долголетие.",
    },
    driversTitle: "Что даёт разницу",
    driversHint: "Насколько каждый показатель сдвигает результат относительно хорошей панели",
    driverAdds: (y: string) => `+${y} года(лет)`,
    driverSubtracts: (y: string) => `−${y} года(лет)`,
    noDrivers: "Все показатели близки к ориентиру.",
    invalid: "Проверьте значения: СРБ должен быть больше нуля, возраст — тоже.",
    switchUnits: "Единицы",
    lifestyleTitle: "Расчётная поправка к возрасту",
    lifestyleResult: "Возраст с поправкой на факторы риска",
    lifestyleDisclaimerTitle: "Это не биологический возраст",
    lifestyleDisclaimer:
      "Здесь сложены известные поправки к ожидаемой продолжительности жизни от восьми факторов. Складывать их строго говоря нельзя: факторы связаны между собой, и сумма завышает эффект. Смотрите не на итоговое число, а на то, какие строки в разбивке весят больше всего — это и есть ваш список дел.",
    breakdownTitle: "Из чего сложилось",
    factors: {
      smoking: {
        label: "Курение",
        options: {
          never: "Никогда не курил",
          "quit-long": "Бросил больше 10 лет назад",
          "quit-recent": "Бросил меньше 10 лет назад",
          current: "Курю сейчас",
        },
      },
      activity: {
        label: "Физическая активность",
        options: {
          high: "Больше 300 минут в неделю",
          moderate: "150–300 минут в неделю",
          low: "Меньше 150 минут в неделю",
          sedentary: "Практически нет",
        },
      },
      bmi: {
        label: "Индекс массы тела",
        options: {
          under: "Меньше 18,5",
          normal: "18,5–25",
          over: "25–30",
          obese1: "30–35",
          obese2: "35–40",
          obese3: "Больше 40",
        },
      },
      alcohol: {
        label: "Алкоголь",
        options: {
          none: "Не пью или до 100 г этанола в неделю",
          light: "100–200 г в неделю",
          moderate: "200–350 г в неделю",
          heavy: "Больше 350 г в неделю",
        },
      },
      diet: {
        label: "Питание",
        options: {
          good: "Овощи и фрукты каждый день, цельные злаки, рыба",
          mixed: "Как получится",
          poor: "В основном ультраобработанная еда",
        },
      },
      sleep: {
        label: "Сон",
        options: {
          optimal: "7–9 часов",
          short: "6–7 часов",
          "very-short": "Меньше 6 часов",
          long: "Больше 9 часов",
        },
      },
      bp: {
        label: "Артериальное давление",
        options: {
          optimal: "Ниже 120/80",
          normal: "120–139 / 80–89",
          high1: "140–159 / 90–99",
          high2: "160/100 и выше",
        },
      },
      social: {
        label: "Социальные связи",
        options: {
          strong: "Есть близкие люди, вижусь регулярно",
          some: "Средне",
          isolated: "Почти ни с кем не общаюсь",
        },
      },
    },
  },
  en: {
    tabBlood: "From blood work",
    tabLifestyle: "From lifestyle",
    tabBloodHint: "PhenoAge — the Levine formula, validated against mortality",
    tabLifestyleHint: "No blood test needed. This is not a biological age",
    age: "Your age",
    years: "years",
    markers: {
      albumin: "Albumin",
      creatinine: "Creatinine",
      glucose: "Fasting glucose",
      crp: "CRP (high-sensitivity)",
      lymphocytes: "Lymphocytes",
      mcv: "MCV — mean cell volume",
      rdw: "RDW — red cell distribution width",
      alp: "Alkaline phosphatase",
      wbc: "White blood cells",
    },
    units: { lymphocytes: "%", mcv: "fL", rdw: "%", alp: "U/L", wbc: "×10³/µL" },
    resultTitle: "Your PhenoAge",
    chronological: "Chronological age",
    deltaYounger: (y: string) => `${y} years younger than your birth certificate`,
    deltaOlder: (y: string) => `${y} years older than your birth certificate`,
    deltaSame: "the same as your chronological age",
    bands: {
      muchYounger:
        "Your markers are well above average for your age. That is a good result — but remember PhenoAge is a surrogate measure, not a guarantee.",
      younger: "Your markers are better than average for your age.",
      same: "You are ageing at roughly the population-average rate. That is normal, and not something to act on.",
      older:
        "Your markers are worse than average for your age. Look at which ones are driving it — the list is below.",
      muchOlder:
        "That is a large gap, and it usually comes from one or two specific out-of-range values rather than ageing in general. Take the panel to a doctor: this is a diagnostic conversation, not a longevity one.",
    },
    driversTitle: "What drives the gap",
    driversHint: "How far each marker moves the result compared with a healthy reference panel",
    driverAdds: (y: string) => `+${y} yrs`,
    driverSubtracts: (y: string) => `−${y} yrs`,
    noDrivers: "Every marker sits close to the reference.",
    invalid: "Check your values: CRP and age both need to be greater than zero.",
    switchUnits: "Units",
    lifestyleTitle: "Estimated adjustment to your age",
    lifestyleResult: "Your age adjusted for risk factors",
    lifestyleDisclaimerTitle: "This is not a biological age",
    lifestyleDisclaimer:
      "This adds up known life-expectancy effects from eight factors. Strictly speaking they should not be summed — the factors correlate, so the total overstates the effect. Ignore the headline number and read the breakdown instead: the heaviest rows are your to-do list.",
    breakdownTitle: "Where it comes from",
    factors: {
      smoking: {
        label: "Smoking",
        options: {
          never: "Never smoked",
          "quit-long": "Quit more than 10 years ago",
          "quit-recent": "Quit less than 10 years ago",
          current: "Currently smoke",
        },
      },
      activity: {
        label: "Physical activity",
        options: {
          high: "More than 300 min a week",
          moderate: "150–300 min a week",
          low: "Under 150 min a week",
          sedentary: "Essentially none",
        },
      },
      bmi: {
        label: "Body mass index",
        options: {
          under: "Below 18.5",
          normal: "18.5–25",
          over: "25–30",
          obese1: "30–35",
          obese2: "35–40",
          obese3: "Above 40",
        },
      },
      alcohol: {
        label: "Alcohol",
        options: {
          none: "None, or under 100 g ethanol a week",
          light: "100–200 g a week",
          moderate: "200–350 g a week",
          heavy: "More than 350 g a week",
        },
      },
      diet: {
        label: "Diet",
        options: {
          good: "Vegetables and fruit daily, whole grains, fish",
          mixed: "Hit and miss",
          poor: "Mostly ultra-processed food",
        },
      },
      sleep: {
        label: "Sleep",
        options: {
          optimal: "7–9 hours",
          short: "6–7 hours",
          "very-short": "Under 6 hours",
          long: "Over 9 hours",
        },
      },
      bp: {
        label: "Blood pressure",
        options: {
          optimal: "Below 120/80",
          normal: "120–139 / 80–89",
          high1: "140–159 / 90–99",
          high2: "160/100 or above",
        },
      },
      social: {
        label: "Social connection",
        options: {
          strong: "Close people I see regularly",
          some: "Somewhere in between",
          isolated: "I rarely talk to anyone",
        },
      },
    },
  },
} as const;

const MARKER_ORDER: MarkerId[] = [
  "albumin",
  "creatinine",
  "glucose",
  "crp",
  "lymphocytes",
  "mcv",
  "rdw",
  "alp",
  "wbc",
];

const DEFAULT_LIFESTYLE: LifestyleAnswers = {
  smoking: "never",
  activity: "moderate",
  bmi: "normal",
  alcohol: "none",
  diet: "mixed",
  sleep: "optimal",
  bp: "normal",
  social: "some",
};

const nf = (n: number, digits = 1) =>
  Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: digits });

export function BiologicalAgeCalculator({ locale = "ru" }: { locale?: Locale }) {
  const c = COPY[locale] ?? COPY.ru;

  const [mode, setMode] = useState<"blood" | "lifestyle">("blood");
  const [age, setAge] = useState(45);
  const [values, setValues] = useState<Record<MarkerId, number>>({ ...REFERENCE, crp: 1 });
  // СРБ в поле вводится в мг/л, формуле нужны мг/дл — храним выбранную единицу отдельно
  const [altUnits, setAltUnits] = useState<Record<UnitField, boolean>>({
    albumin: false,
    creatinine: false,
    glucose: false,
    crp: false,
  });
  const [lifestyle, setLifestyle] = useState<LifestyleAnswers>(DEFAULT_LIFESTYLE);

  /** Приводим введённое к единицам формулы */
  const toFormula = useMemo(() => {
    return (id: MarkerId, raw: number): number => {
      if (id === "crp") return altUnits.crp ? raw : CONVERT.crpFromMgl(raw);
      if (id in UNIT_FIELDS) {
        const field = UNIT_FIELDS[id as UnitField];
        return altUnits[id as UnitField] ? field.convert(raw) : raw;
      }
      return raw;
    };
  }, [altUnits]);

  const blood = useMemo(() => {
    const input: PhenoAgeInput = {
      age,
      albumin: toFormula("albumin", values.albumin),
      creatinine: toFormula("creatinine", values.creatinine),
      glucose: toFormula("glucose", values.glucose),
      crp: toFormula("crp", values.crp),
      lymphocytes: values.lymphocytes,
      mcv: values.mcv,
      rdw: values.rdw,
      alp: values.alp,
      wbc: values.wbc,
    };

    const result = phenoAge(input);
    if (result === null) return null;

    // Вклад маркера = насколько изменится результат, если подставить ориентир
    const drivers = MARKER_ORDER.map((id) => {
      const swapped = phenoAge({ ...input, [id]: REFERENCE[id] });
      return { id, years: swapped === null ? 0 : result - swapped };
    })
      .filter((d) => Math.abs(d.years) >= 0.15)
      .sort((a, b) => Math.abs(b.years) - Math.abs(a.years));

    const delta = result - age;
    const band: Band =
      delta <= -5
        ? "muchYounger"
        : delta <= -2
          ? "younger"
          : delta < 2
            ? "same"
            : delta < 5
              ? "older"
              : "muchOlder";

    return { result, delta, band, drivers };
  }, [age, values, toFormula]);

  const life = useMemo(() => lifestyleOffset(lifestyle), [lifestyle]);

  const accent =
    mode === "lifestyle"
      ? life.total > 3
        ? "clay"
        : life.total < -1
          ? "leaf"
          : "moss"
      : !blood
        ? "moss"
        : blood.delta >= 5
          ? "clay"
          : blood.delta >= 2
            ? "amber"
            : blood.delta <= -2
              ? "leaf"
              : "moss";

  const setMarker = (id: MarkerId, raw: string) =>
    setValues((v) => ({ ...v, [id]: Number(raw) || 0 }));

  return (
    <section
      data-accent={accent}
      className="not-prose my-10 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
    >
      {/* ── Переключатель режимов ────────────────────────────── */}
      <div className="grid grid-cols-2 gap-px bg-[var(--line)]">
        {(["blood", "lifestyle"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`px-4 py-3.5 text-left transition-colors ${
              mode === m
                ? "bg-[var(--accent-tint)] text-[var(--ink)]"
                : "bg-[var(--surface)] text-[var(--ink-soft)] hover:bg-[var(--surface-2)]"
            }`}
          >
            <span className="block text-[0.95rem] font-semibold">
              {m === "blood" ? c.tabBlood : c.tabLifestyle}
            </span>
            <span className="mt-0.5 block text-[0.76rem] leading-snug text-[var(--ink-faint)]">
              {m === "blood" ? c.tabBloodHint : c.tabLifestyleHint}
            </span>
          </button>
        ))}
      </div>

      {mode === "blood" ? (
        <>
          <div className="grid gap-4 p-5 md:p-7">
            <div className="sm:max-w-[12rem]">
              <label
                htmlFor="bioage-age"
                className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
              >
                {c.age}
              </label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  id="bioage-age"
                  type="number"
                  min={18}
                  max={110}
                  value={age}
                  onChange={(e) => setAge(Math.max(0, Math.min(110, Number(e.target.value) || 0)))}
                  className="w-24 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 font-display text-xl font-semibold tabular-nums"
                />
                <span className="text-[var(--ink-soft)]">{c.years}</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {MARKER_ORDER.map((id) => {
                const unitField = id in UNIT_FIELDS ? UNIT_FIELDS[id as UnitField] : null;
                const isAlt = unitField ? altUnits[id as UnitField] : false;
                const unitLabel = unitField
                  ? locale === "en"
                    ? isAlt
                      ? unitField.altEn
                      : unitField.siEn
                    : isAlt
                      ? unitField.alt
                      : unitField.si
                  : c.units[id as keyof typeof c.units];

                return (
                  <div key={id}>
                    <label
                      htmlFor={`bioage-${id}`}
                      className="block text-[0.78rem] font-semibold leading-snug text-[var(--ink-soft)]"
                    >
                      {c.markers[id]}
                    </label>
                    <div className="mt-1.5 flex items-stretch gap-1.5">
                      <input
                        id={`bioage-${id}`}
                        type="number"
                        step="any"
                        min={0}
                        value={values[id]}
                        onChange={(e) => setMarker(id, e.target.value)}
                        className="w-full min-w-0 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 tabular-nums"
                      />
                      {unitField ? (
                        <button
                          type="button"
                          onClick={() =>
                            setAltUnits((u) => ({
                              ...u,
                              [id as UnitField]: !u[id as UnitField],
                            }))
                          }
                          title={c.switchUnits}
                          className="shrink-0 rounded-xl border border-[var(--line)] px-2.5 text-[0.74rem] font-semibold text-[var(--ink-faint)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--brand-strong)]"
                        >
                          {unitLabel} ⇄
                        </button>
                      ) : (
                        <span className="grid shrink-0 place-items-center px-1.5 text-[0.74rem] text-[var(--ink-faint)]">
                          {unitLabel}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-[var(--line)] bg-[var(--accent-tint)] p-5 md:p-7">
            {!blood ? (
              <p className="text-[var(--ink-soft)]">{c.invalid}</p>
            ) : (
              <>
                <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
                  {c.resultTitle}
                </p>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="font-display text-[2.75rem] font-semibold leading-none tabular-nums text-[var(--accent)]">
                    {nf(blood.result)}
                  </span>
                  <span className="text-[0.95rem] text-[var(--ink-soft)]">
                    {Math.abs(blood.delta) < 0.5
                      ? c.deltaSame
                      : blood.delta < 0
                        ? c.deltaYounger(nf(blood.delta))
                        : c.deltaOlder(nf(blood.delta))}
                    {" · "}
                    {c.chronological}: {age}
                  </span>
                </div>

                <p className="mt-4 text-[0.98rem] leading-relaxed text-[var(--ink-soft)]">
                  {c.bands[blood.band]}
                </p>

                <div className="mt-6">
                  <p className="font-semibold">{c.driversTitle}</p>
                  <p className="mt-0.5 text-[0.82rem] text-[var(--ink-faint)]">{c.driversHint}</p>
                  {blood.drivers.length === 0 ? (
                    <p className="mt-3 text-[0.92rem] text-[var(--ink-soft)]">{c.noDrivers}</p>
                  ) : (
                    <ul className="mt-3 space-y-1.5">
                      {blood.drivers.map((d) => (
                        <li
                          key={d.id}
                          className="flex items-center justify-between gap-3 rounded-lg bg-[var(--surface)] px-3.5 py-2 text-[0.9rem]"
                        >
                          <span className="min-w-0 truncate">{c.markers[d.id]}</span>
                          <span
                            className={`shrink-0 font-semibold tabular-nums ${
                              d.years > 0 ? "text-[var(--accent)]" : "text-[var(--brand-strong)]"
                            }`}
                          >
                            {d.years > 0 ? c.driverAdds(nf(d.years)) : c.driverSubtracts(nf(d.years))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 p-5 md:p-7 sm:grid-cols-2">
            {LIFESTYLE_FACTORS.map((factor) => {
              const copy = c.factors[factor.id as keyof typeof c.factors];
              return (
                <div key={factor.id}>
                  <label
                    htmlFor={`life-${factor.id}`}
                    className="block text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]"
                  >
                    {copy.label}
                  </label>
                  <select
                    id={`life-${factor.id}`}
                    value={lifestyle[factor.id]}
                    onChange={(e) =>
                      setLifestyle((s) => ({ ...s, [factor.id]: e.target.value }))
                    }
                    className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 text-[0.92rem]"
                  >
                    {factor.options.map((o) => (
                      <option key={o.id} value={o.id}>
                        {copy.options[o.id as keyof typeof copy.options]}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          <div className="border-t border-[var(--line)] bg-[var(--accent-tint)] p-5 md:p-7">
            <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
              {c.lifestyleTitle}
            </p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="font-display text-[2.75rem] font-semibold leading-none tabular-nums text-[var(--accent)]">
                {life.total > 0 ? "+" : life.total < 0 ? "−" : "±"}
                {nf(life.total)}
              </span>
              <span className="text-[0.95rem] text-[var(--ink-soft)]">
                {c.lifestyleResult}: {nf(age + life.total)} {c.years}
              </span>
            </div>

            <div className="mt-6">
              <p className="font-semibold">{c.breakdownTitle}</p>
              <ul className="mt-3 space-y-1.5">
                {life.breakdown
                  .slice()
                  .sort((a, b) => b.years - a.years)
                  .map((b) => {
                    const copy = c.factors[b.factor as keyof typeof c.factors];
                    return (
                      <li
                        key={b.factor}
                        className="flex items-center justify-between gap-3 rounded-lg bg-[var(--surface)] px-3.5 py-2 text-[0.9rem]"
                      >
                        <span className="min-w-0 truncate">{copy.label}</span>
                        <span
                          className={`shrink-0 font-semibold tabular-nums ${
                            b.years > 0
                              ? "text-[var(--accent)]"
                              : b.years < 0
                                ? "text-[var(--brand-strong)]"
                                : "text-[var(--ink-faint)]"
                          }`}
                        >
                          {b.years > 0 ? "+" : b.years < 0 ? "−" : "±"}
                          {nf(b.years)}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </div>

            <div className="mt-6 rounded-xl border border-[color-mix(in_oklab,var(--accent)_30%,var(--line))] bg-[var(--surface)] p-4">
              <p className="font-semibold">⚠️ {c.lifestyleDisclaimerTitle}</p>
              <p className="mt-1.5 text-[0.92rem] leading-relaxed text-[var(--ink-soft)]">
                {c.lifestyleDisclaimer}
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
